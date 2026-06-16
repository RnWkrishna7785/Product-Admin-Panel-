import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { LayoutDashboard, Boxes, ShoppingCart, LogOut, X, BarChart2 } from 'lucide-react';

const Sidebar = ({ open, onClose }) => {
  const sidebarRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    if (open) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const menuItems = [
    { path: '/',          name: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', name: 'Inventory', icon: Boxes },
    { path: '/orders',    name: 'Orders',    icon: ShoppingCart },
  ];

  return (
    <>
      
      <aside
        ref={sidebarRef}
        className="
          fixed top-0 left-0 z-40 h-screen w-64
          hidden md:flex flex-col
        "
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <SidebarContent menuItems={menuItems} onLogout={handleLogout} />
      </aside>

      
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-72
          flex flex-col md:hidden
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <SidebarContent menuItems={menuItems} onLogout={handleLogout} onNavClick={onClose} />
      </aside>
    </>
  );
};

const SidebarContent = ({ menuItems, onLogout, onNavClick }) => {
  const user = JSON.parse(localStorage.getItem('userInfo')) || {};
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full p-4">
      
      <div
        onClick={() => {
          navigate('/');
          if (onNavClick) onNavClick();
        }}
        className="flex items-center gap-3 px-3 py-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity select-none"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <BarChart2 size={18} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Vortex Control</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Panel</p>
        </div>
      </div>

      
      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold px-3 mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Main Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'opacity-100' : 'opacity-70'} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      
      <div className="mt-auto space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-table-head)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {(user.name || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name || 'Admin'}</p>
            <p className="text-xs capitalize truncate" style={{ color: 'var(--text-muted)' }}>{user.role || 'Administrator'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <LogOut size={18} className="opacity-80" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;