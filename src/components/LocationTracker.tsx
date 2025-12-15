import { useEffect, useState, useRef } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useCreateLocationLog, useUpdateLocationLog, useLocationLogs } from '@/hooks/useDirectusData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationTrackerProps {
  vehicleId?: string;
  driverId?: string;
}

export const LocationTracker = ({ vehicleId, driverId }: LocationTrackerProps) => {
  const { position, error } = useGeolocation();
  const createLocationLog = useCreateLocationLog();
  const updateLocationLog = useUpdateLocationLog();
  const { data: locationLogs } = useLocationLogs();
  const { toast } = useToast();
  const [locationLogId, setLocationLogId] = useState<string | null>(null);
  const hasCreatedLog = useRef(false);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Location Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error]);

  // Find existing location log for this vehicle or driver
  useEffect(() => {
    if (locationLogs && (vehicleId || driverId)) {
      const existingLog = locationLogs.find((log: any) => {
        const logVehicleId = typeof log.vehicle_id === 'object' ? log.vehicle_id?.id : log.vehicle_id;
        const logDriverId = typeof log.driver_id === 'object' ? log.driver_id?.id : log.driver_id;
        
        if (vehicleId && logVehicleId === vehicleId) return true;
        if (driverId && logDriverId === driverId) return true;
        return false;
      });

      if (existingLog) {
        setLocationLogId(existingLog.id);
        hasCreatedLog.current = true;
      }
    }
  }, [locationLogs, vehicleId, driverId]);

  useEffect(() => {
    // Always track location when logged in
    if (position && (vehicleId || driverId)) {
      const updateLocation = () => {
        const locationData = {
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed || undefined,
          heading: position.heading || undefined,
          timestamp: new Date().toISOString(),
        };

        if (locationLogId) {
          // Update existing location log
          updateLocationLog.mutate({
            id: locationLogId,
            data: locationData,
          });
        } else if (!hasCreatedLog.current) {
          // Create initial location log
          hasCreatedLog.current = true;
          createLocationLog.mutate(
            {
              vehicle_id: vehicleId,
              driver_id: driverId,
              ...locationData,
            },
            {
              onSuccess: (data: any) => {
                setLocationLogId(data.id);
              },
            }
          );
        }
      };

      // Update immediately
      updateLocation();

      // Update every 3 seconds
      const interval = setInterval(updateLocation, 3000);

      return () => clearInterval(interval);
    }
  }, [position, vehicleId, driverId, locationLogId]);

  return null;
};
