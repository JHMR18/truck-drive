import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useDrivers, useDriverProfiles, useVehicles, useCreateDriverProfile, useUpdateDriverProfile } from '@/hooks/useDirectusData';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Edit, Trash2, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';

const Drivers = () => {
  const { user, loading: authLoading } = useDirectusAuth();
  const navigate = useNavigate();
  const { data: drivers, isLoading: driversLoading, refetch: refetchDrivers } = useDrivers();
  const { data: driverProfiles, isLoading: profilesLoading, refetch: refetchProfiles } = useDriverProfiles();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const createDriverProfile = useCreateDriverProfile();
  const updateDriverProfile = useUpdateDriverProfile();
  
  const loading = driversLoading || profilesLoading || vehiclesLoading;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [selectedDriverForAction, setSelectedDriverForAction] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    license_number: '',
    assigned_vehicle_id: '',
    availability_status: 'Available',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        // Update existing driver user via Directus API
        const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/users/${editingDriver.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('directus_access_token')}`,
          },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
          }),
        });

        if (!response.ok) throw new Error('Failed to update user');

        // Update driver profile
        const profile = driverProfiles?.find((p: any) => p.user_id === editingDriver.id);
        if (profile) {
          await updateDriverProfile.mutateAsync({
            id: profile.id,
            data: {
              license_number: formData.license_number,
              assigned_vehicle_id: formData.assigned_vehicle_id || null,
              availability_status: formData.availability_status,
            },
          });
        } else {
          // Create profile if doesn't exist
          await createDriverProfile.mutateAsync({
            user_id: editingDriver.id,
            license_number: formData.license_number,
            assigned_vehicle_id: formData.assigned_vehicle_id || null,
            availability_status: formData.availability_status,
          });
        }

        toast.success('Driver updated successfully');
      } else {
        // Create new driver user
        // First, get the Driver role ID
        const rolesResponse = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/roles?filter[name][_eq]=Driver`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('directus_access_token')}`,
          },
        });

        const rolesData = await rolesResponse.json();
        const driverRole = rolesData.data?.[0];

        if (!driverRole) {
          throw new Error('Driver role not found in Directus. Please create it first.');
        }

        const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('directus_access_token')}`,
          },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            password: formData.password,
            role: driverRole.id, // Use the actual role UUID
            status: 'active',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.errors?.[0]?.message || 'Failed to create user');
        }

        const result = await response.json();
        const newUserId = result.data.id;

        // Create driver profile
        await createDriverProfile.mutateAsync({
          user_id: newUserId,
          license_number: formData.license_number,
          assigned_vehicle_id: formData.assigned_vehicle_id || null,
          availability_status: formData.availability_status,
        });

        toast.success('Driver added successfully');
      }

      setDialogOpen(false);
      resetForm();
      
      // Refresh data instead of reloading page
      await refetchDrivers();
      await refetchProfiles();
    } catch (error: any) {
      console.error('Error saving driver:', error);
      toast.error(error.message || 'Failed to save driver');
    }
  };

  const handleDelete = async (driver: any) => {
    setSelectedDriverForAction(driver);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDriverForAction) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/users/${selectedDriverForAction.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('directus_access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast.success('Driver deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedDriverForAction(null);
      
      // Refresh data
      await refetchDrivers();
      await refetchProfiles();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    }
  };

  const handlePasswordReset = (driver: any) => {
    setSelectedDriverForAction(driver);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const confirmPasswordReset = async () => {
    if (!selectedDriverForAction || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/users/${selectedDriverForAction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('directus_access_token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) throw new Error('Failed to reset password');

      toast.success('Password reset successfully');
      setPasswordDialogOpen(false);
      setSelectedDriverForAction(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const openDialog = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver);
      
      // Find profile - user_id might be an object
      const profile = driverProfiles?.find((p: any) => {
        const userId = typeof p.user_id === 'object' ? p.user_id.id : p.user_id;
        return userId === driver.id;
      });
      
      // Handle assigned_vehicle_id - it might be an object with id property or just an ID
      let vehicleId = '';
      if (profile?.assigned_vehicle_id) {
        vehicleId = typeof profile.assigned_vehicle_id === 'object' 
          ? profile.assigned_vehicle_id.id 
          : profile.assigned_vehicle_id;
      }
      
      setFormData({
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        password: '',
        license_number: profile?.license_number || '',
        assigned_vehicle_id: vehicleId,
        availability_status: profile?.availability_status || 'Available',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDriver(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      license_number: '',
      assigned_vehicle_id: '',
      availability_status: 'Available',
    });
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Driver Management</h1>
                <p className="text-xs text-muted-foreground">Manage driver accounts and assignments</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  {!editingDriver && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assigned_vehicle">Assigned Vehicle</Label>
                    <Select
                      value={formData.assigned_vehicle_id ? String(formData.assigned_vehicle_id) : "none"}
                      onValueChange={(value) => setFormData({ ...formData, assigned_vehicle_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vehicles?.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                            {vehicle.plate_number} ({vehicle.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="availability_status">Availability Status</Label>
                    <Select
                      value={formData.availability_status}
                      onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="On Mission">On Mission</SelectItem>
                        <SelectItem value="Off Duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingDriver ? 'Update' : 'Create'} Driver
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Assigned Vehicle</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers && drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No drivers found. Click "Add Driver" to create your first driver account.
                  </TableCell>
                </TableRow>
              ) : (
                drivers?.map((driver: any) => {
                  // Find driver profile to get assigned vehicle
                  // user_id might be an object or just an ID
                  const profile = driverProfiles?.find((p: any) => {
                    const userId = typeof p.user_id === 'object' ? p.user_id.id : p.user_id;
                    return userId === driver.id;
                  });
                  
                  // Handle assigned_vehicle_id - it might be an object or an ID
                  let assignedVehicle = null;
                  if (profile?.assigned_vehicle_id) {
                    if (typeof profile.assigned_vehicle_id === 'object') {
                      // If it's already expanded, use it directly
                      assignedVehicle = profile.assigned_vehicle_id;
                    } else {
                      // If it's just an ID, find the vehicle
                      assignedVehicle = vehicles?.find((v: any) => v.id === profile.assigned_vehicle_id);
                    }
                  }
                  
                  return (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.first_name} {driver.last_name}</TableCell>
                      <TableCell>{driver.email || 'N/A'}</TableCell>
                      <TableCell>{profile?.license_number || 'N/A'}</TableCell>
                      <TableCell>
                        {assignedVehicle ? assignedVehicle.plate_number : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={profile?.availability_status || 'Off Duty'} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={driver.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(driver)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePasswordReset(driver)}
                            title="Reset Password"
                          >
                            🔑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(driver)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Password Reset Modal */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reset password for: <strong>{selectedDriverForAction?.first_name} {selectedDriverForAction?.last_name}</strong>
            </p>
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPasswordReset}>
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Are you sure you want to delete <strong>{selectedDriverForAction?.first_name} {selectedDriverForAction?.last_name}</strong>?
            </p>
            <p className="text-sm text-destructive">
              This action cannot be undone. The driver account and all associated data will be permanently deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Driver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Drivers;
