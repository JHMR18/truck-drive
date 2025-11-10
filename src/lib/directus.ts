import { createDirectus, rest, authentication, staticToken } from '@directus/sdk';

// Define schema types
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number?: string;
  status: 'active' | 'suspended' | 'archived';
}

export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  availability_status: 'Available' | 'On Mission' | 'Off Duty';
  assigned_vehicle_id?: string;
  performance_score?: number;
  hours_logged?: number;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  type: 'Ambulance' | 'Fire Truck' | 'Supply Truck' | 'Rescue Vehicle' | 'Command Vehicle' | 'Other';
  status: 'Idle' | 'Deployed' | 'HQ' | 'Maintenance';
  assigned_driver_id?: string; // FK to users.id (role=Driver)
  last_known_location?: {
    lat: number;
    lng: number;
  };
  fuel_level?: number;
  maintenance_due_date?: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
  start_time?: string;
  end_time?: string;
  assigned_vehicle_id?: string;
  assigned_driver_id?: string; // FK to users.id (role=Driver)
  created_by?: string; // FK to users.id
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  issue_reported: string;
  reported_date: string;
  resolved_date?: string;
  resolution_notes?: string;
  reported_by?: string;
}

export interface Notification {
  id: string;
  sender_id?: string;
  recipient_id?: string;
  type: 'Alert' | 'Broadcast' | 'SOS' | 'Instruction';
  message: string;
  timestamp: string;
  status: 'Delivered' | 'Read';
}

export interface LocationLog {
  id: string;
  vehicle_id?: string;
  driver_id?: string; // FK to users.id (role=Driver)
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface DirectusSchema {
  directus_users: User[];
  driver_profiles: DriverProfile[];
  vehicles: Vehicle[];
  missions: Mission[];
  maintenance_logs: MaintenanceLog[];
  notifications: Notification[];
  location_logs: LocationLog[];
}

// Create Directus client
const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

// Create a custom fetch that adds the Authorization header
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('directus_access_token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

export const directus = createDirectus<DirectusSchema>(directusUrl, {
  globals: {
    fetch: customFetch,
  },
}).with(rest());

export default directus;
