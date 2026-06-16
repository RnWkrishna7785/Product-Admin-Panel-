import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2, RefreshCw, Plus, X, ShoppingBag, FileSpreadsheet, Search } from 'lucide-react';
import API from '../utils/api';
import { logActivity } from '../utils/activityLogger';

const ORDER_STATUSES   = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Refunded'];

const statusBadgeClass = (s) => {
  const m = {
    Pending:    'badge-pending',
    Processing: 'badge-processing',
    Shipped:    'badge-shipped',
    Delivered:  'badge-delivered',
    Cancelled:  'badge-cancelled',
  };
  return `badge ${m[s] || ''}`;
};

const paymentBadgeClass = (s) => {
  const m = { Paid: 'badge-paid', Unpaid: 'badge-unpaid', Refunded: 'badge-refunded' };
  return `badge ${m[s] || ''}`;
};


const Orders = () => {
  const [orders,        setOrders]        = useState([]);
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [search,         setSearch]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');


  const [custName,       setCustName]       = useState('');
  const [selectedItems,  setSelectedItems]  = useState([{ product: '', quantity: 1 }]);
  const [payStatus,      setPayStatus]      = useState('Unpaid');
  const [createLoading,  setCreateLoading]  = useState(false);
  const [createError,    setCreateError]    = useState('');

  const tableRef = useRef(null);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/orders');
      setOrders(data);
      setLoading(false);
      setTimeout(() => {
        if (tableRef.current) {
          const rows = tableRef.current.querySelectorAll('tbody tr');
          if (rows.length) gsap.fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
        }
      }, 50);
    } catch {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products');
      setProducts(data.filter((p) => p.stock > 0));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);


  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      logActivity('info', `Order ${id.slice(-6).toUpperCase()} status updated to "${status}".`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status');
    }
  };

  
  const handlePaymentChange = async (id, paymentStatus) => {
    try {
      await API.put(`/orders/${id}/payment`, { paymentStatus });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, paymentStatus } : o)));
      logActivity('success', `Order ${id.slice(-6).toUpperCase()} payment changed to "${paymentStatus}".`);
    } catch {
      alert('Error updating payment status');
    }
  };


  const addItem = () => setSelectedItems((p) => [...p, { product: '', quantity: 1 }]);
  const removeItem = (i) => setSelectedItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setSelectedItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));

  const computeTotal = () => {
    return selectedItems.reduce((acc, item) => {
      const prod = products.find((p) => p._id === item.product);
      return acc + (prod ? prod.price * Number(item.quantity) : 0);
    }, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!custName.trim()) { setCreateError('Customer name is required.'); return; }
    const validItems = selectedItems.filter((i) => i.product && Number(i.quantity) > 0);
    if (validItems.length === 0) { setCreateError('Add at least one product.'); return; }

    const orderItems = validItems.map((i) => {
      const prod = products.find((p) => p._id === i.product);
      return { product: i.product, quantity: Number(i.quantity), price: prod?.price || 0 };
    });

    const total = computeTotal();

    setCreateLoading(true);
    try {
      await API.post('/orders', {
        customerName: custName.trim(),
        orderItems,
        totalPrice: total,
        paymentStatus: payStatus,
      });
      logActivity('success', `Created order for customer "${custName.trim()}" ($${total.toFixed(2)}).`);
      setShowCreate(false);
      setCustName('');
      setSelectedItems([{ product: '', quantity: 1 }]);
      setPayStatus('Unpaid');
      fetchOrders();
      fetchProducts(); 
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating order');
    } finally {
      setCreateLoading(false);
    }
  };


  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Items Count', 'Items Detail', 'Total Price ($)', 'Payment Status', 'Order Status', 'Date'];
    const rows = filteredOrders.map(o => {
      const itemsDetail = o.orderItems.map(i => `${i.product?.name || 'Deleted Product'} (x${i.quantity})`).join('; ');
      return [
        `"${o._id}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.orderItems.length,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        o.totalPrice.toFixed(2),
        `"${o.paymentStatus}"`,
        `"${o.status}"`,
        `"${new Date(o.createdAt).toLocaleDateString()}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vortex_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logActivity('info', `Exported ${filteredOrders.length} orders to CSV.`);
  };


  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderItems.some(item => item.product?.name?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">


      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Track orders, update status and manage payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="btn-secondary p-2.5 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => { setShowCreate(true); setCreateError(''); }} className="btn-primary cursor-pointer">
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>


      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-3xl">

          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by customer or product name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '36px' }}
            />
          </div>


          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base sm:w-44 cursor-pointer"
          >
            <option value="All">All Order Statuses</option>
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>


          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input-base sm:w-44 cursor-pointer"
          >
            <option value="All">All Payments</option>
            {PAYMENT_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>


        <button
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="btn-secondary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export orders list to CSV"
        >
          <FileSpreadsheet size={15} />
          <span>Export CSV</span>
        </button>
      </div>


      <div className="card overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table ref={tableRef}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Update Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <ShoppingBag size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders match the selected filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {order.customerName}
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {item.product?.name || 'Deleted Product'}{' '}
                              <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td>
                        <span className={paymentBadgeClass(order.paymentStatus)}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-input)',
                            border: '1.5px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentChange(order._id, e.target.value)}
                          className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-input)',
                            border: '1.5px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create New Order</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-5">
      
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="input-base"
                  placeholder="John Doe"
                />
              </div>

      
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Products *
                  </label>
                  <button type="button" onClick={addItem} className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: '#2563eb' }}>
                    <Plus size={13} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(i, 'product', e.target.value)}
                        className="input-base flex-1 cursor-pointer"
                        style={{ padding: '8px 12px' }}
                        required
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} — ${p.price.toFixed(2)} ({p.stock} left)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max={products.find((p) => p._id === item.product)?.stock || 999}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        className="input-base"
                        style={{ width: '70px', padding: '8px 10px', flexShrink: 0 }}
                        placeholder="Qty"
                      />
                      {selectedItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0 cursor-pointer">
                          <X size={15} style={{ color: '#dc2626' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

      
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Payment Status
                </label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value)}
                  className="input-base cursor-pointer"
                >
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

      
              {computeTotal() > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--bg-table-head)', border: '1px solid var(--border)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Order Total</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${computeTotal().toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary cursor-pointer">Cancel</button>
                <button type="submit" disabled={createLoading} className="btn-primary cursor-pointer">
                  {createLoading ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;