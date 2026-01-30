import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ServerIcon,
  StarIcon,
  RssIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Scripts', href: '/scripts', icon: CodeBracketIcon },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon },
  { name: 'Todos', href: '/todos', icon: ClipboardDocumentListIcon },
  { name: 'Procedures', href: '/procedures', icon: BookOpenIcon },
  { name: 'Registries', href: '/registries', icon: ComputerDesktopIcon },
  { name: 'Zabbix', href: '/zabbix', icon: ServerIcon },
  { name: 'RSS Feeds', href: '/rss', icon: RssIcon },
  { name: 'Favorites', href: '/favorites', icon: StarIcon },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-dark-950/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ServerIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-dark-100">AdminDash</span>
            </NavLink>
            <button
              className="lg:hidden p-1 rounded-lg hover:bg-dark-700"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6 text-dark-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-dark-700">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-2',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                )
              }
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Settings</span>
            </NavLink>

            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-dark-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-dark-700"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-dark-800/95 backdrop-blur border-b border-dark-700">
          <div className="flex items-center justify-between h-full px-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-dark-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-dark-300" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search everything... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
