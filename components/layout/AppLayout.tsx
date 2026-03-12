'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PrintHeader } from './PrintHeader';
import { BotFab } from './BotFab';
import { ToastContainer } from '@/components/ui/Toast';
import Store from '@/lib/store';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Init theme
    const savedTheme = Store.get<string>('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const publicPages = ['/login', '/register'];

  useEffect(() => {
    if (!isAuthenticated && !publicPages.includes(pathname)) {
      router.replace('/login');
    }
  }, [isAuthenticated, pathname, router]);

  // Public pages - no layout
  if (publicPages.includes(pathname)) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  // Not authenticated and not on login - show nothing while redirecting
  if (!isAuthenticated) return null;

  return (
    <>
      <PrintHeader />
      <ToastContainer />
      <div id="app" className="active" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
          <div className="page-content">
            {children}
          </div>
        </div>
        <BotFab />
      </div>
    </>
  );
}
