import { useState } from 'react';
import { useNotifications, useCreateNotification, useMarkNotificationRead } from '@/hooks/useDirectusData';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Bell, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { user } = useDirectusAuth();
  const { data: notifications } = useNotifications(user?.id);
  const createNotification = useCreateNotification();
  const markAsRead = useMarkNotificationRead();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleSendBroadcast = () => {
    if (!broadcastMessage) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    createNotification.mutate(
      {
        sender_id: user?.id,
        type: 'Broadcast',
        message: broadcastMessage,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Broadcast Sent',
            description: 'Message has been sent to all users',
          });
          setBroadcastMessage('');
          setDialogOpen(false);
        },
      }
    );
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
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Broadcast Message</DialogTitle>
                <DialogDescription>
                  Send a message to all users in the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter your broadcast message..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSendBroadcast} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              notification.type === 'SOS' ? 'destructive' : 'default'
                            }
                          >
                            {notification.type}
                          </Badge>
                          {notification.status === 'Delivered' && (
                            <Badge variant="outline">Unread</Badge>
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
                      onClick={() => markAsRead.mutate(notification.id)}
                      variant="outline"
                      size="sm"
                    >
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
