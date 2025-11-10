import { useEffect, useState } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useDirectusData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Truck, RefreshCw, Map as MapIcon, List, Ambulance, MapPin, Activity, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

const VehicleTracking = () => {
  const { user, loading: authLoading } = useDirectusAuth();
  const navigate = useNavigate();
  const { data: vehicles, isLoading: vehiclesLoading, refetch } = useVehicles();
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const loading = vehiclesLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (vehicles) {
      applyFilters();
    }
  }, [vehicles, filterType, filterStatus]);

  const applyFilters = () => {
    if (!vehicles) return;
    let filtered = [...vehicles];

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
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="relative h-[calc(100vh-280px)] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
                </div>

                <div className="relative p-6">
                  <p className="text-center text-muted-foreground mb-6">
                    Interactive Map View - Tayabas City
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredVehicles.map((vehicle) => {
                      const Icon = getVehicleIcon(vehicle.type);
                      return (
                        <Sheet key={vehicle.id}>
                          <SheetTrigger asChild>
                            <button
                              className="p-4 bg-white rounded-lg shadow-card hover:shadow-hover transition-all border-2 border-transparent hover:border-primary"
                              onClick={() => setSelectedVehicle(vehicle)}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getStatusColor(vehicle.status))}>
                                    <Icon className="w-6 h-6 text-white" />
                                  </div>
                                  <div className={cn('absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white', getStatusColor(vehicle.status))} />
                                </div>
                                <span className="text-xs font-medium text-center">{vehicle.plate_number}</span>
                                <StatusBadge status={vehicle.status} />
                              </div>
                            </button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-[400px]">
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {vehicle.plate_number}
                              </SheetTitle>
                              <SheetDescription>Vehicle Details</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Type</p>
                                  <p className="font-medium">{vehicle.type}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <StatusBadge status={vehicle.status} />
                                </div>
                              </div>

                              {vehicle.drivers && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Assigned Driver</p>
                                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                                    <User className="w-4 h-4 text-primary" />
                                    <div>
                                      <p className="font-medium">{vehicle.drivers.full_name}</p>
                                      <p className="text-xs text-muted-foreground">{vehicle.drivers.contact_number}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Current Location</p>
                                <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-lg">
                                  <MapPin className="w-4 h-4 text-secondary" />
                                  <div>
                                    <p className="text-sm font-mono">
                                      {vehicle.current_location?.lat.toFixed(4)}, {vehicle.current_location?.lng.toFixed(4)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tayabas City, Quezon</p>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Last updated: {new Date().toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      );
                    })}
                  </div>
                </div>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getStatusColor(vehicle.status))}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold">{vehicle.plate_number}</h3>
                          <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                          {vehicle.drivers && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Driver: {vehicle.drivers.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={vehicle.status} />
                    </div>
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
