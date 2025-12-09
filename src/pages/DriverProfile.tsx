import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { useDriverProfile, useUpdateDriverProfile, useVehicles } from '@/hooks/useDirectusData';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Truck, Shield, Activity as ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';

const DriverProfile = () => {
    const { user, loading: authLoading } = useDirectusAuth();
    const navigate = useNavigate();
    const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useDriverProfile(user?.id);
    const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
    const updateDriverProfile = useUpdateDriverProfile();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        license_number: '',
        availability_status: 'Available',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && profile) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                license_number: profile.license_number || '',
                availability_status: profile.availability_status || 'Available',
            });
        } else if (user) {
            // Fallback if no profile yet
            setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            }));
        }
    }, [user, profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        try {
            // Update profile data
            await updateDriverProfile.mutateAsync({
                id: profile.id,
                data: {
                    license_number: formData.license_number,
                    availability_status: formData.availability_status,
                },
            });

            // Note: Updating user table (name/email) would require a separate API call to /users/:id
            // For now, we are only updating the driver_profile fields as per usual permission patterns
            // If user update is needed, we'd add that here.

            toast.success('Profile updated successfully');
            refetchProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        }
    };

    if (authLoading || profileLoading || vehiclesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <ActivityIcon className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Find assigned vehicle details
    let assignedVehicle = null;
    if (profile?.assigned_vehicle_id) {
        if (typeof profile.assigned_vehicle_id === 'object') {
            assignedVehicle = profile.assigned_vehicle_id;
        } else {
            assignedVehicle = vehicles?.find((v: any) => v.id === profile.assigned_vehicle_id);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-24">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">My Profile</h1>
                            <p className="text-xs text-muted-foreground">Manage your information</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Your basic account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        disabled
                                        className="bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        disabled
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-muted/50"
                                />
                                <p className="text-xs text-muted-foreground">Contact admin to update personal details.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Professional Details */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Professional Details
                            </CardTitle>
                            <CardDescription>License and status information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="license_number">License Number</Label>
                                <Input
                                    id="license_number"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    placeholder="Enter license number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="availability_status">Current Status</Label>
                                <Select
                                    value={formData.availability_status}
                                    onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Available">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-status-available" />
                                                Available
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="On Mission">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-status-on_mission" />
                                                On Mission
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="Off Duty">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-status-off_duty" />
                                                Off Duty
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assigned Vehicle */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Assigned Vehicle
                            </CardTitle>
                            <CardDescription>Your currently assigned vehicle</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assignedVehicle ? (
                                <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Truck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{assignedVehicle.plate_number}</p>
                                        <p className="text-sm text-muted-foreground">{assignedVehicle.type}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignedVehicle.status === 'Deployed' ? 'bg-status-on_mission/20 text-status-on_mission' :
                                                assignedVehicle.status === 'Idle' ? 'bg-status-available/20 text-status-available' :
                                                    'bg-gray-200 text-gray-700'
                                            }`}>
                                            {assignedVehicle.status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No vehicle currently assigned</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button type="submit" size="lg" className="w-full">
                        Save Changes
                    </Button>
                </form>
            </main>

            <BottomNav />
        </div>
    );
};

export default DriverProfile;
