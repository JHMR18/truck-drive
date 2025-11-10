import { useEffect, useState } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useMissions, useUpdateMission, useDriverProfile } from '@/hooks/useDirectusData';
import { LocationTracker } from '@/components/LocationTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DriverDashboard() {
  const { user } = useDirectusAuth();
  const { data: missions, isLoading } = useMissions();
  const { data: driverProfile } = useDriverProfile(user?.id);
  const updateMission = useUpdateMission();
  const { toast } = useToast();

  console.log('Current user ID:', user?.id);
  console.log('All missions:', missions);
  console.log('Driver profile:', driverProfile);

  const myMissions = missions?.filter((m: any) => {
    // assigned_driver_id might be an object or just an ID
    const driverIdInMission = typeof m.assigned_driver_id === 'object' 
      ? m.assigned_driver_id?.id 
      : m.assigned_driver_id;
    
    console.log('Mission driver ID:', driverIdInMission, 'My ID:', user?.id);
    
    return driverIdInMission === user?.id && m.status !== 'Completed';
  });

  console.log('Filtered missions for driver:', myMissions);

  const handleUpdateStatus = (missionId: string, status: string) => {
    updateMission.mutate(
      { id: missionId, data: { status } },
      {
        onSuccess: () => {
          toast({
            title: 'Mission Updated',
            description: `Mission status changed to ${status}`,
          });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {driverProfile?.assigned_vehicle_id && (
        <LocationTracker
          vehicleId={driverProfile.assigned_vehicle_id}
          driverId={user?.id}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mission Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.first_name} {user?.last_name}</p>
          </div>
          <Badge variant="outline" className="text-lg py-2 px-4">
            {driverProfile?.availability_status || 'Unknown'}
          </Badge>
        </div>

        {driverProfile?.assigned_vehicle_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Assigned Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(driverProfile.assigned_vehicle_id as any)?.plate_number || 'N/A'}
              </p>
              <p className="text-gray-600">
                {(driverProfile.assigned_vehicle_id as any)?.type || 'Unknown Type'}
              </p>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Active Missions</h2>
          {myMissions && myMissions.length > 0 ? (
            <div className="space-y-4">
              {myMissions.map((mission: any) => (
                <Card key={mission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{mission.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {mission.description}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(mission.status)}>
                        {mission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {mission.start_time
                            ? new Date(mission.start_time).toLocaleString()
                            : 'Not started'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {mission.status === 'Planned' && (
                        <Button
                          onClick={() => handleUpdateStatus(mission.id, 'In Progress')}
                          className="flex-1"
                        >
                          Start Mission
                        </Button>
                      )}
                      {mission.status === 'In Progress' && (
                        <>
                          <Button
                            onClick={() => handleUpdateStatus(mission.id, 'Completed')}
                            className="flex-1"
                            variant="default"
                          >
                            Complete
                          </Button>
                          <Button
                            onClick={() => handleUpdateStatus(mission.id, 'Delayed')}
                            className="flex-1"
                            variant="destructive"
                          >
                            Report Delay
                          </Button>
                        </>
                      )}
                      {mission.status === 'Delayed' && (
                        <Button
                          onClick={() => handleUpdateStatus(mission.id, 'In Progress')}
                          className="flex-1"
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No active missions assigned</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
