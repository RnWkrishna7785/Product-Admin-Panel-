import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Plus, Trash2, Edit3, Loader2, Search, X, Package, FileSpreadsheet
} from 'lucide-react';
import API from '../utils/api';
import { logActivity } from '../utils/activityLogger';

const emptyForm = { name: '', sku: '', price: '', category: '', stock: '', description: '', imageUrl: '' };

const Inventory = () => {
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter,    setStockFilter]    = useState('All');
  const [modalMode,      setModalMode]      = useState(null); 
  const [form,           setForm]           = useState(emptyForm);
  const [editId,         setEditId]         = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [formError,      setFormError]      = useState('');

  const tableRef = useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/products');
      setProducts(data);
      setLoading(false);
      setTimeout(() => {
        if (tableRef.current) {
          const rows = tableRef.current.querySelectorAll('tbody tr');
          if (rows.length) {
            gsap.fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
          }
        }
      }, 50);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormError('');
    setModalMode('add');
  };

  const openEditModal = (product) => {
    setForm({
      name:        product.name,
      sku:         product.sku,
      price:       String(product.price),
      category:    product.category,
      stock:       String(product.stock),
      description: product.description,
      imageUrl:    product.imageUrl || '',
    });
    setEditId(product._id);
    setFormError('');
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setFormError(''); };

  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    const payload = {
      name:        form.name.trim(),
      sku:         form.sku.trim().toUpperCase(),
      price:       Number(form.price),
      category:    form.category.trim(),
      stock:       Number(form.stock),
      description: form.description.trim(),
      imageUrl:    form.imageUrl.trim(),
    };
    try {
      if (modalMode === 'add') {
        await API.post('/products', payload);
        logActivity('success', `Added new product "${payload.name}" to inventory.`);
      } else {
        await API.put(`/products/${editId}`, payload);
        logActivity('info', `Updated product details for "${payload.name}".`);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from inventory? This cannot be undone.`)) return;
    try {
      await API.delete(`/products/${id}`);
      logActivity('warning', `Removed product "${name}" from inventory.`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Price ($)', 'Stock Quantity', 'Description', 'Image URL'];
    const rows = filtered.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.price,
      p.stock,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${(p.imageUrl || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vortex_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logActivity('info', `Exported ${filtered.length} products to CSV.`);
  };

  const stockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-out-stock">Out of Stock</span>;
    if (stock <= 5)  return <span className="badge badge-low-stock">{stock} Low</span>;
    return <span className="badge badge-in-stock">{stock} In Stock</span>;
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'InStock') {
      matchesStock = p.stock > 5;
    } else if (stockFilter === 'LowStock') {
      matchesStock = p.stock > 0 && p.stock <= 5;
    } else if (stockFilter === 'OutOfStock') {
      matchesStock = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

  
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inventory</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Manage your products, stock and pricing
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex-shrink-0 cursor-pointer">
          <Plus size={16} />
          Add Product
        </button>
      </div>

  
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, SKU, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '36px' }}
            />
          </div>

      
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-base sm:w-48 cursor-pointer"
            style={{ paddingRight: '24px' }}
          >
            <option value="All">All Categories</option>
            {categories.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>


        <button
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className="btn-secondary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export products list to CSV"
        >
          <FileSpreadsheet size={15} />
          <span>Export CSV</span>
        </button>
      </div>


      <div className="flex border-b border-[var(--border)] overflow-x-auto pb-px">
        {[
          { key: 'All', label: 'All Inventory' },
          { key: 'InStock', label: 'In Stock' },
          { key: 'LowStock', label: 'Low Stock' },
          { key: 'OutOfStock', label: 'Out of Stock' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStockFilter(tab.key)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all duration-150 ${
              stockFilter === tab.key
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      <div className="card overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading inventory…</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table ref={tableRef}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Package size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No products match the selected criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                              style={{ border: '1px solid var(--border)' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--bg-table-head)', border: '1px solid var(--border)' }}
                            >
                              <Package size={14} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <code className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: 'var(--bg-table-head)', color: 'var(--text-secondary)' }}>
                          {product.sku}
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{product.category}</td>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        ${product.price.toFixed(2)}
                      </td>
                      <td>{stockBadge(product.stock)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={15} style={{ color: '#2563eb' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

   
      {modalMode && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Name *</label>
                  <input name="name" required value={form.name} onChange={handleField} className="input-base" placeholder="e.g. iPhone 15 Pro" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU *</label>
                  <input name="sku" required value={form.sku} onChange={handleField} className="input-base" placeholder="e.g. IPH-15-PRO" disabled={modalMode === 'edit'} style={modalMode === 'edit' ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price ($) *</label>
                  <input name="price" type="number" step="0.01" min="0" required value={form.price} onChange={handleField} className="input-base" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Qty *</label>
                  <input name="stock" type="number" min="0" required value={form.stock} onChange={handleField} className="input-base" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category *</label>
                <input name="category" required value={form.category} onChange={handleField} className="input-base" placeholder="e.g. Electronics" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL (optional)</label>
                <input name="imageUrl" type="url" value={form.imageUrl} onChange={handleField} className="input-base" placeholder="https://example.com/image.jpg" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description *</label>
                <textarea name="description" rows={3} required value={form.description} onChange={handleField} className="input-base resize-none" placeholder="Product description…" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">
                  {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : (modalMode === 'add' ? 'Add Product' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;