import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
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
  CpuChipIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: Squares2X2Icon },
  { name: 'Scripts', href: '/scripts', icon: CodeBracketIcon },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon },
  { name: 'Tâches', href: '/todos', icon: ClipboardDocumentListIcon },
  { name: 'Projets', href: '/projects', icon: FolderIcon },
  { name: 'Procédures', href: '/procedures', icon: BookOpenIcon },
  { name: 'Registres', href: '/registries', icon: ComputerDesktopIcon },
  { name: 'Zabbix', href: '/zabbix', icon: ServerIcon },
  { name: 'Flux RSS', href: '/rss', icon: RssIcon },
  { name: 'Favoris', href: '/favorites', icon: StarIcon },
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
          className="fixed inset-0 z-40 bg-dark-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-dark-900 border-r border-dark-800 transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/25">
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-50">
                <span className="text-primary-400">NEXUS</span>HUB
              </span>
            </NavLink>
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-dark-800"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-5 h-5 text-dark-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Settings & User */}
          <div className="p-4 border-t border-dark-800">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Paramètres</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-dark-900/95 backdrop-blur-md border-b border-dark-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-dark-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-dark-400" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Rechercher partout (scripts, notes, projets)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </form>

            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-dark-100">
                  {user?.firstName || user?.username || 'Admin Sys'}
                </p>
                <p className="text-xs text-primary-400">En ligne</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-primary-400/30">
                  <span className="text-sm font-bold text-white">
                    {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'A').toUpperCase()}
                    {(user?.lastName?.charAt(0) || 'S').toUpperCase()}
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-dark-900 rounded-full" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-colors"
                title="Déconnexion"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
