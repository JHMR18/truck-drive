import { useEffect, useState } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useNavigate } from 'react-router-dom';
import { useVehicles, useLocationLogs } from '@/hooks/useDirectusData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Truck, RefreshCw, Map as MapIcon, List, Ambulance, MapPin, Activity, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { VehicleMap } from '@/components/VehicleMap';
import { cn } from '@/lib/utils';

const VehicleTracking = () => {
  const { user, loading: authLoading } = useDirectusAuth();
  const navigate = useNavigate();
  const { data: vehicles, isLoading: vehiclesLoading, refetch } = useVehicles();
  const { data: locationLogs, isLoading: logsLoading } = useLocationLogs(1000);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [vehiclesWithLocation, setVehiclesWithLocation] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const loading = vehiclesLoading || logsLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (vehiclesWithLocation.length > 0) {
      applyFilters();
    }
  }, [vehiclesWithLocation, filterType, filterStatus]);

  // Combine vehicles with their latest location
  useEffect(() => {
    if (vehicles && locationLogs) {
      const vehiclesWithLoc = vehicles.map((vehicle: any) => {
        // Find the latest location log for this vehicle
        const locationLog = locationLogs.find((log: any) => {
          const logVehicleId = typeof log.vehicle_id === 'object' ? log.vehicle_id?.id : log.vehicle_id;
          return logVehicleId === vehicle.id;
        });

        const vehicleData = {
          ...vehicle,
          location: locationLog ? {
            latitude: locationLog.latitude,
            longitude: locationLog.longitude,
            speed: locationLog.speed,
            heading: locationLog.heading,
            timestamp: locationLog.timestamp,
          } : null,
        };

        // Log to check driver data
        console.log('Vehicle data:', vehicleData);
        return vehicleData;
      });

      setVehiclesWithLocation(vehiclesWithLoc);
    }
  }, [vehicles, locationLogs]);

  const applyFilters = () => {
    if (!vehiclesWithLocation) return;
    let filtered = [...vehiclesWithLocation];

    if (filterType !== 'all') {
      filtered = filtered.filter((v) => v.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((v) => v.status === filterStatus);
    }

    setFilteredVehicles(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ambulance':
        return Ambulance;
      case 'firetruck':
        return Truck;
      default:
        return Truck;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-status-available';
      case 'on_duty':
        return 'bg-warning';
      case 'maintenance':
        return 'bg-status-critical';
      default:
        return 'bg-muted';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-24">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Vehicle Tracking</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Ambulance">Ambulance</SelectItem>
                <SelectItem value="Firetruck">Firetruck</SelectItem>
                <SelectItem value="Patrol">Patrol</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_duty">On Duty</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-4 h-4 mr-1" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {viewMode === 'map' ? (
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5" />
                  Live Vehicle Tracking
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredVehicles.filter(v => v.location).length} / {filteredVehicles.length} vehicles tracked
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[calc(100vh-280px)] min-h-[600px]">
                <VehicleMap vehicles={filteredVehicles} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => {
              const Icon = getVehicleIcon(vehicle.type);
              return (
                <Card key={vehicle.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getStatusColor(vehicle.status))}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold">{vehicle.plate_number}</h3>
                          <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                        </div>
                      </div>
                      <StatusBadge status={vehicle.status} />
                    </div>

                    {vehicle.location && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Current Location</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {vehicle.location.latitude.toFixed(6)}, {vehicle.location.longitude.toFixed(6)}
                            </p>
                            {vehicle.location.timestamp && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated: {new Date(vehicle.location.timestamp).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!vehicle.location && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                        No location data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default VehicleTracking;
