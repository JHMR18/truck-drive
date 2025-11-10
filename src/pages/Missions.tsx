import { useState } from 'react';
import { useMissions, useCreateMission, useUpdateMission, useVehicles, useDrivers } from '@/hooks/useDirectusData';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Missions() {
  const { user } = useDirectusAuth();
  const { data: missions, isLoading } = useMissions();
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_vehicle_id: '',
    assigned_driver_id: '',
    start_time: '',
  });

  const handleCreateMission = () => {
    if (!formData.title) {
      toast({
        title: 'Error',
        description: 'Mission title is required',
        variant: 'destructive',
      });
      return;
    }

    createMission.mutate(
      {
        ...formData,
        status: 'Planned',
        created_by: user?.id,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Mission Created',
            description: 'New mission has been created successfully',
          });
          setFormData({
            title: '',
            description: '',
            assigned_vehicle_id: '',
            assigned_driver_id: '',
            start_time: '',
          });
          setDialogOpen(false);
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned':
        return 'bg-blue-500';
      case 'In Progress':
        return 'bg-yellow-500';
      case 'Completed':
        return 'bg-green-500';
      case 'Delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'Delayed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const availableVehicles = vehicles?.filter((v: any) => v.status === 'Idle' || v.status === 'HQ');
  const availableDrivers = drivers?.filter((d: any) => d.status === 'active');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mission Management</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Mission</DialogTitle>
                <DialogDescription>
                  Deploy a vehicle and driver for a new mission
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Mission Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Emergency Response - Flood Relief"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the mission details..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicle">Assign Vehicle</Label>
                    <Select
                      value={formData.assigned_vehicle_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_vehicle_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles?.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate_number} - {vehicle.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="driver">Assign Driver</Label>
                    <Select
                      value={formData.assigned_driver_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_driver_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers?.map((driver: any) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.first_name} {driver.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateMission} className="w-full">
                  Create Mission
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {missions && missions.length > 0 ? (
            missions.map((mission: any) => (
              <Card key={mission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{mission.title}</CardTitle>
                        <Badge className={`${getStatusColor(mission.status)} flex items-center gap-1`}>
                          {getStatusIcon(mission.status)}
                          {mission.status}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {mission.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Vehicle</p>
                      <p className="font-semibold">
                        {mission.assigned_vehicle_id?.plate_number || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Driver</p>
                      <p className="font-semibold">
                        {mission.assigned_driver_id?.first_name} {mission.assigned_driver_id?.last_name || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Start Time</p>
                      <p className="font-semibold">
                        {mission.start_time
                          ? new Date(mission.start_time).toLocaleString()
                          : 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Time</p>
                      <p className="font-semibold">
                        {mission.end_time
                          ? new Date(mission.end_time).toLocaleString()
                          : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No missions created yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
