import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, Truck, Activity, Users, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMissions, useDrivers, useVehicles, useDriverProfiles } from '@/hooks/useDirectusData';

const Analytics = () => {
  const { user, loading: authLoading } = useDirectusAuth();
  const navigate = useNavigate();

  const { data: missions = [], isLoading: missionsLoading } = useMissions();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();

  const analytics = useMemo(() => {
    if (missionsLoading || vehiclesLoading || driversLoading) return null;

    const totalMissions = missions.length;
    const completedMissions = missions.filter((m: any) => m.status === 'Completed').length;

    // 1. Monthly Trends (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        month: months[d.getMonth()],
        year: d.getFullYear(), // Keep track for filtering
        monthIndex: d.getMonth(),
        dispatches: 0
      });
    }

    missions.forEach((m: any) => {
      const d = new Date(m.date_created);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();

      const monthData = last6Months.find(item => item.monthIndex === monthIndex && item.year === year);
      if (monthData) {
        monthData.dispatches++;
      }
    });

    // 2. Response Time Stats
    let totalDuration = 0;
    let completedCountWithTime = 0;
    const distribution = {
      under10: 0,
      under30: 0,
      under60: 0,
      over60: 0
    };

    missions.forEach((m: any) => {
      if (m.status === 'Completed' && m.start_time && m.end_time) {
        const start = new Date(m.start_time).getTime();
        const end = new Date(m.end_time).getTime();
        const durationMinutes = (end - start) / 60000;

        if (durationMinutes > 0) {
          totalDuration += durationMinutes;
          completedCountWithTime++;

          if (durationMinutes < 10) distribution.under10++;
          else if (durationMinutes < 30) distribution.under30++;
          else if (durationMinutes < 60) distribution.under60++;
          else distribution.over60++;
        }
      }
    });

    const averageResponseTime = completedCountWithTime > 0 ? totalDuration / completedCountWithTime : 0;

    // Calculate percentages for distribution
    const totalDist = completedCountWithTime || 1; // Avoid division by zero
    const responseTimeDistribution = [
      { range: '< 10 mins', count: distribution.under10, percentage: (distribution.under10 / totalDist) * 100, color: 'bg-status-available' },
      { range: '10-30 mins', count: distribution.under30, percentage: (distribution.under30 / totalDist) * 100, color: 'bg-primary' },
      { range: '30-60 mins', count: distribution.under60, percentage: (distribution.under60 / totalDist) * 100, color: 'bg-warning' },
      { range: '> 1 hour', count: distribution.over60, percentage: (distribution.over60 / totalDist) * 100, color: 'bg-status-critical' },
    ];

    // 3. Top Vehicles
    const vehicleStats = new Map();
    missions.forEach((m: any) => {
      if (m.assigned_vehicle_id) {
        const vid = m.assigned_vehicle_id.id;
        const current = vehicleStats.get(vid) || { count: 0, info: m.assigned_vehicle_id };
        current.count++;
        vehicleStats.set(vid, current);
      }
    });

    const topVehicles = Array.from(vehicleStats.values())
      .map((v: any) => ({
        id: v.info.id,
        plate: v.info.plate_number,
        type: v.info.type || 'Vehicle',
        dispatches: v.count
      }))
      .sort((a, b) => b.dispatches - a.dispatches)
      .slice(0, 5);

    // 4. Fleet Utilization
    const deployed = vehicles.filter((v: any) => v.status === 'Deployed').length;
    const fleetUtilization = vehicles.length > 0 ? (deployed / vehicles.length) * 100 : 0;

    // 5. Active Drivers (Drivers with completed missions)
    const driverStats = new Map();
    missions.forEach((m: any) => {
      if (m.status === 'Completed' && m.assigned_driver_id) {
        const did = m.assigned_driver_id.id;
        const current = driverStats.get(did) || { count: 0, info: m.assigned_driver_id };
        current.count++;
        driverStats.set(did, current);
      }
    });

    const topDrivers = Array.from(driverStats.entries())
      .map(([id, data]) => ({
        id,
        name: `${data.info.first_name} ${data.info.last_name}`,
        missions: data.count
      }))
      .sort((a, b) => b.missions - a.missions)
      .slice(0, 5);

    // 6. Mission Types Distribution
    const missionTypes = {
      'Typhoon': 0,
      'Vehicle Accident': 0,
      'Burning': 0,
      'Other': 0
    };

    missions.forEach((m: any) => {
      if (m.missions === 'Typhoon') missionTypes['Typhoon']++;
      else if (m.missions === 'Vehicle Accident') missionTypes['Vehicle Accident']++;
      else if (m.missions === 'Burning') missionTypes['Burning']++;
      else missionTypes['Other']++;
    });

    const missionTypeStats = [
      { type: 'Typhoon', count: missionTypes['Typhoon'], color: 'bg-blue-500' },
      { type: 'Vehicle Accident', count: missionTypes['Vehicle Accident'], color: 'bg-orange-500' },
      { type: 'Burning', count: missionTypes['Burning'], color: 'bg-red-500' },
      { type: 'Other', count: missionTypes['Other'], color: 'bg-gray-400' }
    ].filter(t => t.count > 0);

    return {
      totalMissions,
      completedMissions,
      averageResponseTime,
      responseTimeDistribution,
      last6Months,
      topVehicles,
      topDrivers,
      fleetUtilization,
      deployed,
      missionTypeStats
    };
  }, [missions, vehicles, missionsLoading, vehiclesLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || missionsLoading || vehiclesLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-24">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Analytics Dashboard</h1>
              <p className="text-xs text-muted-foreground">Performance insights and metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Missions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalMissions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.completedMissions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.averageResponseTime)}m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fleet Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.fleetUtilization.toFixed(1)}%</p>
              </div>
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Monthly Mission Trends */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Mission Trends</CardTitle>
            <CardDescription>Total missions per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.last6Months.some((m: any) => m.dispatches > 0) ? (
              <div className="h-64 flex items-end justify-around gap-4 px-4">
                {analytics.last6Months.map((item: any, index: number) => {
                  const maxValue = Math.max(...analytics.last6Months.map((d: any) => d.dispatches), 1);
                  const height = (item.dispatches / maxValue) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 gap-2">
                      <div className="text-sm font-medium text-primary">{item.dispatches}</div>
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:opacity-80 animate-in fade-in slide-in-from-bottom-4"
                        style={{
                          height: `${height}%`,
                          minHeight: '4px', // Ensure visibility even if 0
                          animationDelay: `${index * 0.1}s`
                        }}
                      />
                      <div className="text-xs text-muted-foreground">{item.month}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No mission data available for the last 6 months</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mission Type Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Mission Types
            </CardTitle>
            <CardDescription>Breakdown by incident type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.missionTypeStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.missionTypeStats.map((type: any, index: number) => {
                  const percentage = (type.count / analytics.totalMissions) * 100;
                  return (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{type.type}</span>
                          <span className="text-xs text-muted-foreground">{type.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${type.color} rounded-full transition-all`}
                            style={{
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No mission data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Response Time Distribution
            </CardTitle>
            <CardDescription>Breakdown of mission completion times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.responseTimeDistribution.map((item, index) => (
                <div key={item.range} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-24">{item.range}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all animate-scale-in`}
                        style={{
                          width: `${item.percentage}%`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Top Vehicles
              </CardTitle>
              <CardDescription>Most deployed vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topVehicles.length > 0 ? (
                  analytics.topVehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{vehicle.plate}</p>
                          <p className="text-xs text-gray-600">{vehicle.type}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold">{vehicle.dispatches} missions</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No vehicle data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Drivers
              </CardTitle>
              <CardDescription>Most active drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topDrivers.length > 0 ? (
                  analytics.topDrivers.map((driver, index) => (
                    <div key={driver.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                        <p className="text-sm font-medium">{driver.name}</p>
                      </div>
                      <span className="text-sm font-bold">{driver.missions} missions</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No driver data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;