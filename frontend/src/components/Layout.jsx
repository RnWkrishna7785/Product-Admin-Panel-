import { useState } from 'react';
import Sidebar from './common/Sidebar';
import Navbar from './common/Navbar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>
      
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      
      <div className="flex-1 w-full md:pl-64 pt-16 flex flex-col min-w-0">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
