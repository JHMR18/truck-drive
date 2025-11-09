import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Truck, AlertCircle, Users, Activity, MapPin, LogOut, Navigation, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  ongoingIncidents: number;
  activeResponders: number;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    ongoingIncidents: 0,
    activeResponders: 0,
  });
  const [vehicleLocations, setVehicleLocations] = useState({
    onRoad: 0,
    atHQ: 0,
    maintenance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vehiclesRes, incidentsRes, respondersRes] = await Promise.all([
          supabase.from('vehicles').select('*', { count: 'exact' }),
          supabase.from('incidents').select('*', { count: 'exact' }).neq('status', 'resolved'),
          supabase.from('responder_locations').select('*', { count: 'exact' }).eq('is_active', true),
        ]);

        const availableVehicles = vehiclesRes.data?.filter(v => v.status === 'available').length || 0;
        
        // Calculate vehicle locations
        const onRoad = vehiclesRes.data?.filter(v => v.location_status === 'on_road').length || 0;
        const atHQ = vehiclesRes.data?.filter(v => v.location_status === 'hq').length || 0;
        const maintenance = vehiclesRes.data?.filter(v => v.location_status === 'maintenance').length || 0;

        setStats({
          totalVehicles: vehiclesRes.count || 0,
          availableVehicles,
          ongoingIncidents: incidentsRes.count || 0,
          activeResponders: respondersRes.count || 0,
        });

        setVehicleLocations({ onRoad, atHQ, maintenance });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DRRMO Tayabas</h1>
              <p className="text-xs text-muted-foreground">Emergency Response Center</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Command Center</h2>
          <p className="text-muted-foreground">Real-time overview of emergency response operations</p>
          <p className="text-xs text-muted-foreground mt-1">Last sync: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Real-Time Overview Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={Truck}
            trend={{ value: `${stats.availableVehicles} available`, isPositive: true }}
          />
          <StatCard
            title="Available Vehicles"
            value={stats.availableVehicles}
            icon={Truck}
            className="border-l-4 border-l-status-available"
          />
          <StatCard
            title="Ongoing Incidents"
            value={stats.ongoingIncidents}
            icon={AlertCircle}
            className="border-l-4 border-l-warning"
          />
          <StatCard
            title="Active Responders"
            value={stats.activeResponders}
            icon={Users}
            className="border-l-4 border-l-primary"
          />
        </div>

        {/* Vehicle Location Counters */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="shadow-card border-l-4 border-l-secondary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vehicles on Road</p>
                  <h3 className="text-3xl font-bold mt-2 animate-fade-in">{vehicleLocations.onRoad}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vehicles at HQ</p>
                  <h3 className="text-3xl font-bold mt-2 animate-fade-in">{vehicleLocations.atHQ}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Under Maintenance</p>
                  <h3 className="text-3xl font-bold mt-2 animate-fade-in">{vehicleLocations.maintenance}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Map Snapshot */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Vehicle Tracking Map
                </CardTitle>
                <CardDescription>Real-time GPS locations</CardDescription>
              </div>
              <Button onClick={() => navigate('/tracking')} variant="outline" size="sm">
                View Full Map
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
              </div>
              <div className="relative text-center space-y-2">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click "View Full Map" for interactive tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Recent Activity Feed */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Ambulance #2 dispatched', location: 'Barangay San Diego', time: '3 mins ago', type: 'dispatch' },
                  { action: 'Firetruck #1 returned to HQ', location: 'DRRMO Station', time: '12 mins ago', type: 'return' },
                  { action: 'Driver Juan Cruz checked in', location: 'Vehicle #5', time: '25 mins ago', type: 'checkin' },
                  { action: 'New incident reported', location: 'Barangay Lalo', time: '1 hour ago', type: 'incident' },
                  { action: 'Patrol #3 maintenance completed', location: 'Workshop', time: '2 hours ago', type: 'maintenance' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'dispatch' ? 'bg-warning' :
                      activity.type === 'return' ? 'bg-status-available' :
                      activity.type === 'incident' ? 'bg-status-critical' :
                      'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.location}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Alerts & Notifications
              </CardTitle>
              <CardDescription>System warnings and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { message: 'Vehicle #5 low fuel', severity: 'warning', time: '5 mins ago' },
                  { message: 'Maintenance overdue for Unit #3', severity: 'urgent', time: '1 hour ago' },
                  { message: 'New incident in Barangay Lalo', severity: 'urgent', time: '1 hour ago' },
                  { message: 'Driver training scheduled tomorrow', severity: 'info', time: '3 hours ago' },
                  { message: 'Weekly inspection due Friday', severity: 'info', time: '1 day ago' },
                ].map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'urgent' ? 'bg-status-critical/5 border-l-status-critical' :
                      alert.severity === 'warning' ? 'bg-warning/5 border-l-warning' :
                      'bg-primary/5 border-l-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">{alert.message}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Incidents This Month</p>
                  <h3 className="text-3xl font-bold mt-2 text-warning">42</h3>
                  <p className="text-xs text-status-available mt-1">↓ 12% from last month</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <h3 className="text-3xl font-bold mt-2 text-secondary">8.5m</h3>
                  <p className="text-xs text-status-available mt-1">↓ 2min faster</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Drivers Today</p>
                  <h3 className="text-3xl font-bold mt-2 text-primary">{stats.activeResponders}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ready for deployment</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcuts to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate('/vehicles')}
              >
                <Truck className="w-6 h-6" />
                <span className="text-sm">Add Vehicle</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate('/drivers')}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Manage Drivers</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
              >
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm">Report Incident</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate('/analytics')}
              >
                <Activity className="w-6 h-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
