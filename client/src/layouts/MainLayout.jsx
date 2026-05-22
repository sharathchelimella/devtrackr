/**
 * layouts/MainLayout.jsx – Authenticated App Layout
 * Wraps all protected pages with Sidebar + Topbar.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard':     { title: 'Dashboard', subtitle: 'Your productivity at a glance' },
  '/repositories':  { title: 'Repositories', subtitle: 'Your GitHub repositories' },
  '/commits':       { title: 'Commits', subtitle: 'Recent commit activity' },
  '/pull-requests': { title: 'Pull Requests', subtitle: 'PR status and activity' },
  '/issues':        { title: 'Issues', subtitle: 'Open and closed issues' },
  '/ai-insights':   { title: 'AI Insights', subtitle: 'AI-powered productivity analysis' },
  '/settings':      { title: 'Settings', subtitle: 'Account and preferences' },
};

const MainLayout = () => {
  const { pathname } = useLocation();
  const page = pageTitles[pathname] || { title: 'DevTrackr', subtitle: '' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <Topbar title={page.title} subtitle={page.subtitle} />

      {/* Main content area */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: '260px',
          paddingTop: '64px',
        }}
      >
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
