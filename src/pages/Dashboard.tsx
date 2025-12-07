import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useVehicles, useMissions, useDrivers, useMaintenanceLogs } from '@/hooks/useDirectusData';
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
  const { user, loading: authLoading, signOut } = useDirectusAuth();
  const navigate = useNavigate();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: missions, isLoading: missionsLoading } = useMissions();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: maintenanceLogs } = useMaintenanceLogs();

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

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [monthlyIncidents, setMonthlyIncidents] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);

  const loading = vehiclesLoading || missionsLoading || driversLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (vehicles && missions && drivers) {
      // 1. Basic Stats
      const availableVehicles = vehicles.filter((v: any) => v.status === 'Idle').length;
      const ongoingMissions = missions.filter((m: any) => m.status === 'In Progress').length;

      // Calculate active drivers (drivers with missions today or currently active)
      // For now, simpler approach: drivers assigned to ongoing missions
      const activeDriverIds = new Set(missions
        .filter((m: any) => m.status === 'In Progress' && m.assigned_driver_id)
        .map((m: any) => m.assigned_driver_id.id)
      );
      const activeResponders = activeDriverIds.size;

      const deployed = vehicles.filter((v: any) => v.status === 'Deployed').length;
      const atHQ = vehicles.filter((v: any) => v.status === 'HQ' || v.status === 'Idle').length;
      const maintenance = vehicles.filter((v: any) => v.status === 'Maintenance').length;

      setStats({
        totalVehicles: vehicles.length,
        availableVehicles,
        ongoingIncidents: ongoingMissions,
        activeResponders,
      });

      setVehicleLocations({
        onRoad: deployed,
        atHQ,
        maintenance
      });

      // 2. Recent Activity (from Missions)
      // Sort missions by date_created desc
      const sortedMissions = [...missions].sort((a: any, b: any) =>
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      ).slice(0, 5);

      const activityFeed = sortedMissions.map((m: any) => {
        let type = 'primary';
        let action = `Mission: ${m.missions}`;

        if (m.status === 'In Progress') {
          type = 'dispatch';
          action = `${m.assigned_vehicle_id?.plate_number || 'Vehicle'} dispatched`;
        } else if (m.status === 'Completed') {
          type = 'return';
          action = `Mission completed: ${m.missions}`;
        } else if (m.status === 'Planned') {
          type = 'checkin';
        } else if (m.status === 'Delayed') {
          type = 'incident';
          action = `Mission delayed: ${m.missions}`;
        }

        return {
          action,
          location: `Lat: ${Number(m.lat).toFixed(4)}, Long: ${Number(m.long).toFixed(4)}`, // Or reverse geocode if possible, using coords for now
          time: new Date(m.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.date_created,
          type
        };
      });
      setRecentActivity(activityFeed);

      // 3. Alerts (Maintenance + Delayed Missions)
      const alerts = [];

      // Maintenance alerts
      vehicles.forEach((v: any) => {
        if (v.status === 'Maintenance') {
          alerts.push({
            message: `Vehicle ${v.plate_number} in maintenance`,
            severity: 'warning',
            time: 'Ongoing'
          });
        }
      });

      // Delayed missions
      missions.forEach((m: any) => {
        if (m.status === 'Delayed') {
          alerts.push({
            message: `Mission delayed: ${m.missions}`,
            severity: 'urgent',
            time: new Date(m.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      });

      // Add some sample if empty to preserve UI look for logic check
      if (alerts.length === 0) {
        alerts.push({ message: 'System nominal', severity: 'info', time: 'Now' });
      }

      setSystemAlerts(alerts.slice(0, 5));

      // 4. Quick Stats
      // Incidents This Month
      const now = new Date();
      const thisMonthMissions = missions.filter((m: any) => {
        const d = new Date(m.date_created);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      setMonthlyIncidents(thisMonthMissions);

      // Avg Response Time (Completed missions)
      // Assuming 'date_created' is incident report time and 'start_time' is dispatch time
      // Or just duration if start and end exist. Let's use duration (End - Start)
      const completedMissions = missions.filter((m: any) => m.status === 'Completed' && m.start_time && m.end_time);
      if (completedMissions.length > 0) {
        const totalDuration = completedMissions.reduce((acc: number, m: any) => {
          const start = new Date(m.start_time).getTime();
          const end = new Date(m.end_time).getTime();
          return acc + (end - start);
        }, 0);
        // Convert ms to minutes
        setAvgResponseTime(Math.round((totalDuration / completedMissions.length) / 60000));
      } else {
        setAvgResponseTime(0);
      }

    }
  }, [vehicles, missions, drivers]);

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
            <img
              src="/drrmo.png"
              alt="DRRMO Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">TRACK DRIVE</h1>
              <p className="text-xs text-muted-foreground">Vehicle Tracking System</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'dispatch' ? 'bg-warning' :
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
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
                {systemAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${alert.severity === 'urgent' ? 'bg-status-critical/5 border-l-status-critical' :
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
                  <h3 className="text-3xl font-bold mt-2 text-warning">{monthlyIncidents}</h3>
                  <p className="text-xs text-status-available mt-1">Total missions</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Avg Mission Duration</p>
                  <h3 className="text-3xl font-bold mt-2 text-secondary">{avgResponseTime}m</h3>
                  <p className="text-xs text-status-available mt-1">Completed missions</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Responders</p>
                  <h3 className="text-3xl font-bold mt-2 text-primary">{stats.activeResponders}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Drivers on Mission</p>
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
                onClick={() => navigate('/missions')}
              >
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm">Create Mission</span>
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
