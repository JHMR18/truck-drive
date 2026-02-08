import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom vehicle icons
const createVehicleIcon = (type: string, status: string) => {
  const color = status === 'Deployed' ? '#ef4444' : status === 'Idle' ? '#22c55e' : '#94a3b8';

  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">🚗</text>
      <circle cx="32" cy="8" r="6" fill="${color}" stroke="white" stroke-width="2">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-vehicle-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  status: string;
  assigned_driver_id?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  current_driver?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface VehicleMapProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

// Component to fit map bounds to show all vehicles
const FitBounds = ({ vehicles }: { vehicles: Vehicle[] }) => {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length > 0) {
      const bounds = vehicles
        .filter(v => v.location)
        .map(v => [v.location!.latitude, v.location!.longitude] as [number, number]);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [vehicles, map]);

  return null;
};

export const VehicleMap = ({ vehicles, onVehicleSelect }: VehicleMapProps) => {
  // Default center (Tayabas City, Quezon)
  const defaultCenter: [number, number] = [13.9994, 121.5931];

  // Calculate center based on vehicles with location
  const center = useMemo(() => {
    const vehiclesWithLocation = vehicles.filter(v => v.location);
    if (vehiclesWithLocation.length === 0) return defaultCenter;

    const avgLat = vehiclesWithLocation.reduce((sum, v) => sum + v.location!.latitude, 0) / vehiclesWithLocation.length;
    const avgLng = vehiclesWithLocation.reduce((sum, v) => sum + v.location!.longitude, 0) / vehiclesWithLocation.length;

    return [avgLat, avgLng] as [number, number];
  }, [vehicles]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', minHeight: '600px' }}
      className="rounded-lg shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds vehicles={vehicles} />

      {vehicles
        .filter(vehicle => vehicle.location)
        .map((vehicle, index) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.location!.latitude, vehicle.location!.longitude]}
            icon={createVehicleIcon(vehicle.type, vehicle.status)}
            eventHandlers={{
              add: (e) => {
                // Open popup by default for the first vehicle
                if (index === 0) {
                  e.target.openPopup();
                }
              }
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg">{vehicle.plate_number}</h3>
                <p className="text-sm text-gray-600">{vehicle.type}</p>
                {(vehicle.current_driver || vehicle.assigned_driver_id) && (
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <span className="font-medium">Driver:</span>
                    <span className="text-gray-700">
                      {vehicle.current_driver
                        ? `${vehicle.current_driver.first_name} ${vehicle.current_driver.last_name}`
                        : `${vehicle.assigned_driver_id?.first_name} ${vehicle.assigned_driver_id?.last_name}`
                      }
                    </span>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <p>Lat: {vehicle.location!.latitude.toFixed(6)}</p>
                  <p>Lng: {vehicle.location!.longitude.toFixed(6)}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent map click
                      onVehicleSelect?.(vehicle);
                    }}
                    className="w-full py-1.5 px-3 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors"
                  >
                    Assign Mission
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};
