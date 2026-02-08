import { ReactNode, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  Target,
  MessageSquare,
  User,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { PullToRefresh } from './PullToRefresh';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: LayoutProps) => {
  const { user, role, signOut, isAdmin, isDriver } = useDirectusAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const queryClient = useQueryClient();
  const mainRef = useRef<HTMLElement>(null);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
    // Artificial delay to show spinner if network is too fast
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Truck, label: 'Vehicles', path: '/vehicles' },
    { icon: Users, label: 'Drivers', path: '/drivers' },
    { icon: Target, label: 'Missions', path: '/missions' },
    { icon: MapPin, label: 'Tracking', path: '/tracking' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  const driverNavItems = [
    { icon: LayoutDashboard, label: 'My Missions', path: '/driver/dashboard' },
    { icon: Truck, label: 'Vehicle Status', path: '/driver/vehicle' },
    { icon: MessageSquare, label: 'Communication', path: '/driver/communication' },
    { icon: User, label: 'Profile', path: '/driver/profile' },
  ];

  const navItems = isDriver ? driverNavItems : adminNavItems;

  const NavContent = () => (
    <>
      <div className="space-y-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Vehicle Tracking</h2>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                  location.pathname === item.path
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.label;

    // Fallback for non-exact matches or other routes
    if (location.pathname.startsWith('/driver/dashboard')) return 'My Missions';
    if (location.pathname.includes('/dashboard')) return 'Dashboard';

    return 'Vehicle Tracking';
  };

  const getInitials = () => {
    if (!user) return 'TR';
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'TR';
  };

  const getAvatarUrl = () => {
    if (!user?.avatar) return '';
    const baseUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
    return `${baseUrl}/assets/${user.avatar}`;
  };

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row">
      {/* Status Bar Spacer (Mobile Only) - White */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 bg-white z-[60]"
        style={{ height: 'max(env(safe-area-inset-top), 24px)' }}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header
        className="md:hidden sticky top-0 z-50 bg-card border-b min-h-16 flex items-center px-4 py-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div
              className="flex flex-col h-full pt-4"
              style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 24px) + 1rem)' }}
            >
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-4">
          <Truck className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">{getPageTitle()}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <span className="text-xs font-medium mr-1 hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl()} alt={user.first_name} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 md:ml-64 overflow-y-auto md:mt-0 pb-16 md:pb-0">
        <PullToRefresh onRefresh={handleRefresh} scrollRef={mainRef}>
          {children}
        </PullToRefresh>
      </main>

      {/* Mobile Bottom Navigation (only visible on mobile) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
