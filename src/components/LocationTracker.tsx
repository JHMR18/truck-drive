import { useEffect } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useCreateLocationLog } from '@/hooks/useDirectusData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationTrackerProps {
  vehicleId?: string;
  driverId?: string;
}

export const LocationTracker = ({ vehicleId, driverId }: LocationTrackerProps) => {
  const { position, error } = useGeolocation();
  const createLocationLog = useCreateLocationLog();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Location Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error]);

  useEffect(() => {
    if (position && (vehicleId || driverId)) {
      // Send location every 30 seconds
      const interval = setInterval(() => {
        createLocationLog.mutate({
          vehicle_id: vehicleId,
          driver_id: driverId,
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed || undefined,
          heading: position.heading || undefined,
        });
      }, 30000);

      // Send initial location
      createLocationLog.mutate({
        vehicle_id: vehicleId,
        driver_id: driverId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed || undefined,
        heading: position.heading || undefined,
      });

      return () => clearInterval(interval);
    }
  }, [position, vehicleId, driverId]);

  return null;
};
