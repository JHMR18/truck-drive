import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { directus, Mission, Vehicle, DriverProfile } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem, readUsers } from '@directus/sdk';

// Missions hooks
export const useMissions = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      return await directus.request(
        readItems('missions', {
          fields: ['*', 'assigned_vehicle_id.*', 'assigned_driver_id.*'],
          sort: ['-start_time'],
        })
      );
    },
  });
};

export const useCreateMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mission: Partial<Mission>) => {
      return await directus.request(createItem('missions', mission));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

export const useUpdateMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Mission> }) => {
      return await directus.request(updateItem('missions', id, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

// Vehicles hooks
export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      return await directus.request(
        readItems('vehicles', {
          fields: ['*', 'assigned_driver_id.*'],
        })
      );
    },
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Partial<Vehicle>) => {
      return await directus.request(createItem('vehicles', vehicle));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      return await directus.request(updateItem('vehicles', id, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await directus.request(deleteItem('vehicles', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

// Drivers/Users hooks
export const useDrivers = () => {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      // Get all users - we'll filter by role on the frontend if needed
      const users = await directus.request(
        readUsers({
          fields: ['*', 'role.*'],
        })
      );
      
      console.log('All users:', users);
      
      // Filter for drivers - role might be an ID or object
      const drivers = users.filter((user: any) => {
        if (typeof user.role === 'string') {
          // If role is just an ID, we can't filter by name here
          return true; // Return all for now
        }
        return user.role?.name === 'Driver';
      });
      
      console.log('Filtered drivers:', drivers);
      return drivers;
    },
  });
};

export const useDriverProfiles = () => {
  return useQuery({
    queryKey: ['driver_profiles'],
    queryFn: async () => {
      return await directus.request(
        readItems('driver_profiles', {
          fields: ['*', 'user_id.*', 'assigned_vehicle_id.*'],
        })
      );
    },
  });
};

export const useDriverProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['driver_profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const profiles = await directus.request(
        readItems('driver_profiles', {
          filter: { user_id: { _eq: userId } },
          fields: ['*', 'user_id.*', 'assigned_vehicle_id.*'],
          limit: 1,
        })
      );
      return profiles[0] || null;
    },
    enabled: !!userId,
  });
};

export const useCreateDriverProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<DriverProfile>) => {
      return await directus.request(createItem('driver_profiles', profile));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_profiles'] });
    },
  });
};

export const useUpdateDriverProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DriverProfile> }) => {
      return await directus.request(updateItem('driver_profiles', id, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['driver_profile'] });
    },
  });
};

// Location tracking
export const useCreateLocationLog = () => {
  return useMutation({
    mutationFn: async (location: {
      vehicle_id?: string;
      driver_id?: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    }) => {
      return await directus.request(
        createItem('location_logs', {
          ...location,
          timestamp: new Date().toISOString(),
        })
      );
    },
  });
};

// Notifications
export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      return await directus.request(
        readItems('notifications', {
          filter: userId ? { recipient_id: { _eq: userId } } : {},
          sort: ['-timestamp'],
          limit: 50,
        })
      );
    },
    enabled: !!userId,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notification: {
      sender_id?: string;
      recipient_id?: string;
      type: 'Alert' | 'Broadcast' | 'SOS' | 'Instruction';
      message: string;
    }) => {
      return await directus.request(
        createItem('notifications', {
          ...notification,
          timestamp: new Date().toISOString(),
          status: 'Delivered',
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await directus.request(
        updateItem('notifications', id, { status: 'Read' })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Maintenance Logs
export const useMaintenanceLogs = (vehicleId?: string) => {
  return useQuery({
    queryKey: ['maintenance_logs', vehicleId],
    queryFn: async () => {
      return await directus.request(
        readItems('maintenance_logs', {
          filter: vehicleId ? { vehicle_id: { _eq: vehicleId } } : {},
          sort: ['-reported_date'],
        })
      );
    },
  });
};

export const useCreateMaintenanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      vehicle_id: string;
      issue_reported: string;
      reported_by?: string;
    }) => {
      return await directus.request(
        createItem('maintenance_logs', {
          ...log,
          reported_date: new Date().toISOString(),
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_logs'] });
    },
  });
};
