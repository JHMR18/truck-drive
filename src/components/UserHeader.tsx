import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useDirectusData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, LogOut, User, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const UserHeader = ({ title, subtitle, showLogo = true }: UserHeaderProps) => {
  const { user, signOut } = useDirectusAuth();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications(user?.id);
  const markAsRead = useMarkNotificationRead();
  const [notifOpen, setNotifOpen] = useState(false);

  // Get unread notifications count
  const unreadCount = notifications?.filter((n: any) => n.status !== 'Read').length || 0;

  // Get user initials
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Alert':
        return '🚨';
      case 'SOS':
        return '🆘';
      case 'Instruction':
        return '📋';
      case 'Broadcast':
        return '📢';
      default:
        return '📬';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-3">
            {showLogo && (
              <img 
                src="/drrmo.png" 
                alt="DRRMO Logo" 
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              {title && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right: Notifications and User Avatar */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications && notifications.length > 0 ? (
                    <div className="divide-y">
                      {notifications.slice(0, 10).map((notif: any) => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            notif.status !== 'Read' ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notif.id)}
                        >
                          <div className="flex gap-3">
                            <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {notif.type}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTimestamp(notif.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm mt-1 line-clamp-2">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </ScrollArea>
                {notifications && notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => {
                        navigate('/notifications');
                        setNotifOpen(false);
                      }}
                    >
                      View All Notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar ? `https://your-directus-url.com/assets/${user.avatar}` : undefined} alt={user?.first_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
