import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Code,
  CheckSquare,
  BookOpen,
  Server,
  Star,
  Rss,
  Settings,
  LogOut,
  Search,
  Monitor,
  Cpu,
  Folder,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Scripts', href: '/scripts', icon: Code },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Tâches', href: '/todos', icon: CheckSquare },
  { name: 'Projets', href: '/projects', icon: Folder },
  { name: 'Procédures', href: '/procedures', icon: BookOpen },
  { name: 'Registres', href: '/registries', icon: Monitor },
  { name: 'Zabbix', href: '/zabbix', icon: Server },
  { name: 'Flux RSS', href: '/rss', icon: Rss },
  { name: 'Favoris', href: '/favorites', icon: Star },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72',
          'w-72'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'flex items-center h-16',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
          )}>
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <Cpu className="w-6 h-6 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-foreground">
                  <span className="text-primary">NEXUS</span>HUB
                </span>
              )}
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            'flex-1 py-6 space-y-1 overflow-y-auto',
            sidebarCollapsed ? 'px-2' : 'px-4'
          )}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const link = (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    isActive ? 'sidebar-link-active' : 'sidebar-link',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </NavLink>
              );

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>

          {/* Settings */}
          <div className={cn(
            'p-4 border-t border-sidebar-border',
            sidebarCollapsed && 'px-2'
          )}>
            {sidebarCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) => cn(
                      isActive ? 'sidebar-link-active' : 'sidebar-link',
                      'justify-center px-0'
                    )}
                  >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">Paramètres</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                to="/settings"
                className={({ isActive }) => cn(
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span>Paramètres</span>
              </NavLink>
            )}
          </div>
        </div>

        {/* Collapse toggle - positioned at sidebar edge */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronLeft className="w-3 h-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarCollapsed ? 'Agrandir' : 'Réduire'}
          </TooltipContent>
        </Tooltip>
      </aside>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher partout..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName || user?.username || 'Admin Sys'}
                </p>
                <p className="text-xs text-primary">En ligne</p>
              </div>
              <div className="relative">
                <Avatar className="ring-2 ring-primary/30">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'A').toUpperCase()}
                    {(user?.lastName?.charAt(0) || 'S').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Déconnexion</TooltipContent>
              </Tooltip>
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
