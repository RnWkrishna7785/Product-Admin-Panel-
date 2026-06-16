import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { getActivities } from '../../utils/activityLogger';

const pageTitles = {
  '/':          'Dashboard',
  '/inventory': 'Inventory',
  '/orders':    'Orders',
};

const Navbar = ({ onToggleSidebar }) => {
  const navbarRef = useRef(null);
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem('userInfo')) || { name: 'Admin', role: 'admin' };
  const title     = pageTitles[location.pathname] || 'Dashboard';

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activities, setActivities] = useState([]);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    gsap.fromTo(
      navbarRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  
  useEffect(() => {
    if (showNotifications) {
      setActivities(getActivities().slice(0, 5));
    }
  }, [showNotifications]);

  
  useEffect(() => {
    const handleClickAway = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  return (
    <header
      ref={navbarRef}
      className="fixed top-0 right-0 left-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 md:left-64"
      style={{
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg md:hidden transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      
      <div className="flex items-center gap-2">
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun size={18} className="text-amber-500 animate-pulse" />
          ) : (
            <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 relative cursor-pointer"
            aria-label="Notifications"
            title="System alerts"
          >
            <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: '#ef4444' }}
            />
          </button>
          
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-50 py-2"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="px-4 py-2 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>System Notifications</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">Live</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {activities.length === 0 ? (
                  <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors flex gap-2 border-b border-[var(--border)] last:border-b-0">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: act.type === 'success' ? '#16a34a' : act.type === 'warning' ? '#d97706' : act.type === 'error' ? '#dc2626' : '#2563eb'
                        }}
                      />
                      <div className="space-y-0.5">
                        <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{act.message}</p>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-1 text-center border-t border-[var(--border)] mt-1">
                <Link to="/" onClick={() => setShowNotifications(false)} className="text-[10px] font-semibold hover:underline" style={{ color: 'var(--text-secondary)' }}>
                  View All Activity
                </Link>
              </div>
            </div>
          )}
        </div>

        
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors select-none"
            style={{ background: 'var(--bg-table-head)', border: '1px solid var(--border)' }}
            title="User Profile"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {(user.name || 'A')[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:block animate-fade-in" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
          </div>

          {showProfile && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-50 p-4 animate-fade-in"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="flex flex-col items-center text-center pb-3 border-b border-[var(--border)]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 shadow-sm"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: '1.5px solid var(--border)' }}
                >
                  {(user.name || 'A')[0].toUpperCase()}
                </div>
                <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email || 'admin@vortex.com'}</p>
                <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-table-head)', color: 'var(--text-secondary)' }}>
                  {user.role}
                </span>
              </div>
              
              <div className="pt-3 space-y-2">
                <div className="text-[11px] space-y-1" style={{ color: 'var(--text-muted)' }}>
                  <p>Account Type: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Standard Admin</span></p>
                  <p>Status: <span className="font-semibold text-emerald-600">Active Session</span></p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('userInfo');
                    window.location.reload();
                  }}
                  className="w-full mt-2 text-center text-xs font-semibold py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer border border-red-200 dark:border-red-900/30"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;