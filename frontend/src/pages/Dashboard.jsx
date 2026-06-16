import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Boxes, ShoppingCart, TrendingUp, ArrowUpRight,
  Clock, ChevronRight, Target, Award, Activity, ArrowRight,
  PackageOpen
} from 'lucide-react';
import API from '../utils/api';
import { getActivities } from '../utils/activityLogger';


const buildChartData = (orders) => {
  const map = {};
  orders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    map[key] = (map[key] || 0) + o.totalPrice;
  });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ name: key, Revenue: Number((map[key] || 0).toFixed(2)) });
  }
  return result;
};

const statusClass = (s) => {
  const m = { Pending:'badge-pending', Processing:'badge-processing', Shipped:'badge-shipped', Delivered:'badge-delivered', Cancelled:'badge-cancelled' };
  return m[s] || 'badge-pending';
};

const Dashboard = () => {
  const [stats,     setStats]     = useState({ totalSales: 0, totalProducts: 0, totalOrders: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const cardsRef   = useRef([]);
  const salesRef   = useRef(null);
  const prodsRef   = useRef(null);
  const ordersRef  = useRef(null);
  const widgetsRef = useRef([]);

  useEffect(() => {
    if (!localStorage.getItem('userInfo')) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          API.get('/products'),
          API.get('/orders'),
        ]);
        const products = prodRes.data;
        const orders   = orderRes.data;
        const sales    = orders.reduce((acc, o) => acc + o.totalPrice, 0);

        setStats({ totalSales: sales, totalProducts: products.length, totalOrders: orders.length });
        setChartData(buildChartData(orders));
        setRecentOrders(orders.slice(0, 5));
        setActivities(getActivities());

        const counts = {};
        orders.forEach((o) => {
          o.orderItems?.forEach((item) => {
            if (item.product) {
              const prodId = item.product._id || item.product;
              const prodName = item.product.name || 'Unknown Product';
              const prodPrice = item.price || 0;
              if (!counts[prodId]) {
                counts[prodId] = { name: prodName, qty: 0, revenue: 0 };
              }
              counts[prodId].qty += item.quantity;
              counts[prodId].revenue += item.quantity * prodPrice;
            }
          });
        });
        const sorted = Object.values(counts)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 4);
        setTopProducts(sorted);

        setLoading(false);

        gsap.fromTo(salesRef.current,  { textContent: 0 }, { textContent: sales,            duration: 1.4, ease: 'power2.out', snap: { textContent: 1 }, modifiers: { textContent: v => `$${Math.floor(v).toLocaleString()}` } });
        gsap.fromTo(prodsRef.current,  { textContent: 0 }, { textContent: products.length,   duration: 1.2, ease: 'power2.out', snap: { textContent: 1 } });
        gsap.fromTo(ordersRef.current, { textContent: 0 }, { textContent: orders.length,     duration: 1.2, ease: 'power2.out', snap: { textContent: 1 } });

        gsap.fromTo(
          cardsRef.current.filter(Boolean),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: 'power3.out' }
        );

        setTimeout(() => {
          gsap.fromTo(
            widgetsRef.current.filter(Boolean),
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
          );
        }, 100);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const statCards = [
    {
      label: 'Total Revenue',
      ref: salesRef,
      initial: '$0',
      icon: DollarSign,
      iconBg: 'rgba(22, 163, 74, 0.1)',
      iconColor: '#16a34a',
      change: 'Lifetime sales',
    },
    {
      label: 'Products In Stock',
      ref: prodsRef,
      initial: '0',
      icon: Boxes,
      iconBg: 'rgba(37, 99, 235, 0.1)',
      iconColor: '#2563eb',
      change: 'Active items',
    },
    {
      label: 'Total Orders',
      ref: ordersRef,
      initial: '0',
      icon: ShoppingCart,
      iconBg: 'rgba(124, 58, 237, 0.1)',
      iconColor: '#7c3aed',
      change: 'Placed orders',
    },
  ];

  
  const targetGoal = 15000;
  const goalPercentage = Math.round((stats.totalSales / targetGoal) * 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(goalPercentage, 100) / 100) * circumference;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time analytics, sales progress, and operational logs
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Live data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, ref, initial, icon: Icon, iconBg, iconColor, change }, i) => (
          <div
            key={label}
            ref={(el) => (cardsRef.current[i] = el)}
            className="card card-hover p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </p>
              <p ref={ref} className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                {initial}
              </p>
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                {change}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: iconBg }}
            >
              <Icon size={22} style={{ color: iconColor }} />
            </div>
          </div>
        ))}
      </div>

      
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={18} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Revenue Trend</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Daily revenue breakdown over the last 7 days</p>
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--text-primary)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
                labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="var(--text-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: 'var(--text-primary)', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'var(--text-primary)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div ref={(el) => (widgetsRef.current[0] = el)} className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: 'var(--text-secondary)' }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Monthly Goal</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-table-head)', color: 'var(--text-secondary)' }}>
              Target: $15K
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="var(--border)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={goalPercentage >= 100 ? '#16a34a' : 'var(--text-primary)'}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {goalPercentage}%
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)', uppercase: 'true' }}>reached</span>
            </div>
          </div>

          <div className="text-center mt-2 space-y-1">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Revenue generated: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${stats.totalSales.toFixed(2)}</span>
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {goalPercentage >= 100 ? '🎉 Goal accomplished! Excellent sales.' : `Need $${(Math.max(0, targetGoal - stats.totalSales)).toFixed(2)} more to reach target`}
            </p>
          </div>
        </div>

      
        <div ref={(el) => (widgetsRef.current[1] = el)} className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} style={{ color: 'var(--text-secondary)' }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Top Selling Products</p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading top products...</div>
            ) : topProducts.length === 0 ? (
              <div className="py-12 text-center text-xs flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <PackageOpen size={24} />
                No products sold yet. Create orders to generate statistics.
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, idx) => {
                  const maxQty = Math.max(...topProducts.map(x => x.qty)) || 1;
                  const percentWidth = Math.round((p.qty / maxQty) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {p.qty} sold <span style={{ color: 'var(--text-muted)' }}>(${p.revenue.toFixed(2)})</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-table-head)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percentWidth}%`,
                            background: idx === 0 ? '#111827' : idx === 1 ? '#4b5563' : '#9ca3af'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-4 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Based on items sold counts</span>
            <Link to="/inventory" className="flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Manage Inventory <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div ref={(el) => (widgetsRef.current[2] = el)} className="card overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Orders</p>
              <Link
                to="/orders"
                className="text-xs font-semibold flex items-center gap-1 hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.customerName}</td>
                        <td className="font-semibold">${order.totalPrice.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${order.paymentStatus?.toLowerCase()}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        
        <div ref={(el) => (widgetsRef.current[3] = el)} className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} style={{ color: 'var(--text-secondary)' }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>System Activity</p>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No activities logged.</div>
              ) : (
                activities.map((act) => {
                  const getIndicatorColor = (type) => {
                    if (type === 'success') return '#16a34a';
                    if (type === 'warning') return '#d97706';
                    if (type === 'error') return '#dc2626';
                    return '#2563eb';
                  };
                  return (
                    <div key={act.id} className="flex gap-2.5 items-start text-xs">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: getIndicatorColor(act.type) }}
                      />
                      <div className="space-y-0.5">
                        <p style={{ color: 'var(--text-primary)' }}>{act.message}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)', marginTop: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Live operations log</span>
            <button
              onClick={() => { localStorage.removeItem('vortex_activities'); setActivities([]); }}
              className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
            >
              Clear Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;