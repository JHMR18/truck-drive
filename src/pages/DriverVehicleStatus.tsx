import { useState, useEffect } from 'react';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useDriverProfile, useUpdateDriverProfile, useCreateMaintenanceLog } from '@/hooks/useDirectusData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DriverVehicleStatus() {
  const { user } = useDirectusAuth();
  const { data: driverProfile } = useDriverProfile(user?.id);
  const updateDriverProfile = useUpdateDriverProfile();
  const createMaintenanceLog = useCreateMaintenanceLog();
  const { toast } = useToast();

  const [issueReport, setIssueReport] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    if (driverProfile) {
      setAvailabilityStatus(driverProfile.availability_status || '');
    }
  }, [driverProfile]);

  const handleUpdateAvailability = () => {
    if (driverProfile && availabilityStatus) {
      updateDriverProfile.mutate(
        {
          id: driverProfile.id,
          data: { availability_status: availabilityStatus as any },
        },
        {
          onSuccess: () => {
            toast({
              title: 'Status Updated',
              description: 'Your availability status has been updated',
            });
          },
        }
      );
    }
  };

  const handleReportIssue = () => {
    if (driverProfile?.assigned_vehicle_id && issueReport) {
      createMaintenanceLog.mutate(
        {
          vehicle_id: driverProfile.assigned_vehicle_id,
          issue_reported: issueReport,
          reported_by: user?.id,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Issue Reported',
              description: 'Maintenance team has been notified',
            });
            setIssueReport('');
            setReportDialogOpen(false);
          },
        }
      );
    }
  };

  const vehicle = driverProfile?.assigned_vehicle_id;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Vehicle Status</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Availability</CardTitle>
            <CardDescription>Update your current availability status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="On Mission">On Mission</SelectItem>
                <SelectItem value="Off Duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateAvailability} className="w-full">
              Update Status
            </Button>
          </CardContent>
        </Card>

        {vehicle ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Assigned Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plate Number</p>
                  <p className="text-lg font-semibold">{vehicle.plate_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold">{vehicle.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge>{vehicle.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Level</p>
                  <p className="text-lg font-semibold">
                    {vehicle.fuel_level ? `${vehicle.fuel_level}%` : 'N/A'}
                  </p>
                </div>
              </div>

              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Vehicle Issue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Vehicle Issue</DialogTitle>
                    <DialogDescription>
                      Describe the issue you're experiencing with the vehicle
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Describe the issue..."
                      value={issueReport}
                      onChange={(e) => setIssueReport(e.target.value)}
                      rows={5}
                    />
                    <Button onClick={handleReportIssue} className="w-full">
                      Submit Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No vehicle assigned</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold">
                  {driverProfile?.performance_score || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hours Logged</p>
                <p className="text-2xl font-bold">
                  {driverProfile?.hours_logged || 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
