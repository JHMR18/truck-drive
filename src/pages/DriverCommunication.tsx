import { useState, useEffect } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useNotifications, useMarkNotificationRead, useCreateNotification } from '@/hooks/useDirectusData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DriverCommunication() {
  const { user } = useDirectusAuth();
  const { data: notifications } = useNotifications(user?.id);
  const markAsRead = useMarkNotificationRead();
  const sendNotification = useCreateNotification();
  const { toast } = useToast();

  const [sosMessage, setSosMessage] = useState('');
  const [sosDialogOpen, setSosDialogOpen] = useState(false);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleSendSOS = () => {
    if (sosMessage) {
      sendNotification.mutate(
        {
          sender_id: user?.id,
          type: 'SOS',
          message: `SOS: ${sosMessage}`,
        },
        {
          onSuccess: () => {
            toast({
              title: 'SOS Sent',
              description: 'Emergency alert has been sent to dispatch',
              variant: 'destructive',
            });
            setSosMessage('');
            setSosDialogOpen(false);
          },
        }
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'SOS':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'Broadcast':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'Instruction':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount = notifications?.filter((n: any) => n.status === 'Delivered').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Communication</h1>
            <p className="text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={sosDialogOpen} onOpenChange={setSosDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                SEND SOS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">Emergency SOS</DialogTitle>
                <DialogDescription>
                  Send an emergency alert to dispatch. This will be prioritized immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the emergency..."
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSendSOS} variant="destructive" className="w-full">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Send Emergency Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={
                  notification.status === 'Delivered'
                    ? 'border-l-4 border-l-blue-500 bg-blue-50'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={notification.type === 'SOS' ? 'destructive' : 'default'}>
                            {notification.type}
                          </Badge>
                          {notification.status === 'Delivered' && (
                            <Badge variant="outline">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 mb-4">{notification.message}</p>
                  {notification.status === 'Delivered' && (
                    <Button
                      onClick={() => handleMarkAsRead(notification.id)}
                      variant="outline"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No notifications</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
