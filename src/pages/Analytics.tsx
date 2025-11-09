import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, Truck, Activity } from 'lucide-react';

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyData = [
    { month: 'Jan', dispatches: 45 },
    { month: 'Feb', dispatches: 52 },
    { month: 'Mar', dispatches: 61 },
    { month: 'Apr', dispatches: 58 },
    { month: 'May', dispatches: 70 },
    { month: 'Jun', dispatches: 68 },
  ];

  const topVehicles = [
    { plate: 'ABC-1234', dispatches: 28, type: 'Ambulance' },
    { plate: 'DEF-5678', dispatches: 24, type: 'Firetruck' },
    { plate: 'GHI-9012', dispatches: 22, type: 'Patrol' },
    { plate: 'JKL-3456', dispatches: 19, type: 'Rescue' },
    { plate: 'MNO-7890', dispatches: 17, type: 'Ambulance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-24">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Analytics & Reports</h1>
              <p className="text-xs text-muted-foreground">System performance insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold mt-1">8.5 min</p>
                  <p className="text-xs text-status-available mt-1">↓ 12% from last month</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dispatches</p>
                  <p className="text-2xl font-bold mt-1">384</p>
                  <p className="text-xs text-status-available mt-1">↑ 8% this month</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                  <p className="text-2xl font-bold mt-1">76%</p>
                  <p className="text-xs text-warning mt-1">↑ 5% from last week</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Dispatches Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Dispatch Trends</CardTitle>
            <CardDescription>Total dispatches per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-4 px-4">
              {monthlyData.map((item, index) => {
                const maxValue = Math.max(...monthlyData.map(d => d.dispatches));
                const height = (item.dispatches / maxValue) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 gap-2">
                    <div className="text-sm font-medium text-primary">{item.dispatches}</div>
                    <div 
                      className="w-full bg-gradient-primary rounded-t-lg transition-all hover:opacity-80 animate-scale-in"
                      style={{ 
                        height: `${height}%`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    />
                    <div className="text-xs text-muted-foreground">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Active Vehicles */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top 5 Most Active Vehicles</CardTitle>
            <CardDescription>Vehicles with highest dispatch counts this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVehicles.map((vehicle, index) => {
                const maxDispatches = topVehicles[0].dispatches;
                const percentage = (vehicle.dispatches / maxDispatches) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{vehicle.plate}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.type}</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">{vehicle.dispatches}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all animate-scale-in"
                        style={{ 
                          width: `${percentage}%`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>Breakdown of response times this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Under 5 minutes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-status-available rounded-full" style={{ width: '45%' }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">5-10 minutes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">10-15 minutes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: '15%' }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Over 15 minutes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-status-critical rounded-full" style={{ width: '5%' }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;
