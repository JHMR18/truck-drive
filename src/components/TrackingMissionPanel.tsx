
import { useState, useEffect } from 'react';
import { useCreateMission } from '@/hooks/useDirectusData';
import { useDirectusAuth } from '@/contexts/DirectusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LocationPicker } from '@/components/LocationPicker';

interface TrackingMissionPanelProps {
    vehicle: any;
    onClose: () => void;
}

export const TrackingMissionPanel = ({ vehicle, onClose }: TrackingMissionPanelProps) => {
    const { user } = useDirectusAuth();
    const createMission = useCreateMission();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        missions: '',
        description: '',
        assigned_driver_id: '',
        start_time: '',
        lat: null as number | null,
        long: null as number | null,
    });

    useEffect(() => {
        if (vehicle) {
            // Pre-fill driver if available
            const driverId = vehicle.current_driver?.id || vehicle.assigned_driver_id?.id;

            // Pre-fill location from vehicle if available
            const initialLat = vehicle.location?.latitude || null;
            const initialLong = vehicle.location?.longitude || null;

            setFormData(prev => ({
                ...prev,
                assigned_driver_id: driverId || '',
                lat: initialLat,
                long: initialLong,
            }));
        }
    }, [vehicle]);

    const handleCreateMission = () => {
        if (!formData.missions) {
            toast({
                title: 'Error',
                description: 'Mission type is required',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.assigned_driver_id) {
            // If no driver is assigned to the vehicle, we might want to warn or let them pick.
            // For now, based on requirements, we assume "assign missions to THAT driver".
            // If the vehicle has no driver, we should probably check that.
            toast({
                title: 'Error',
                description: 'No driver assigned to this vehicle.',
                variant: 'destructive',
            });
            return;
        }

        createMission.mutate(
            {
                ...formData,
                status: 'Planned',
                created_by: user?.id,
                // We can also explicitly link the vehicle if the backend supports it directly in the mission creation
                // The Missions.tsx only sets 'assigned_driver_id', but let's check if we should set vehicle too.
                // Looking at Missions.tsx, it only sends `assigned_driver_id`. The backend likely infers vehicle or it's just driver-centric.
                // However, we are in "Vehicle Tracking", so linking the vehicle makes sense if the schema supports it.
                // For now, sticking to what Missions.tsx does: `assigned_driver_id`.
            },
            {
                onSuccess: () => {
                    toast({
                        title: 'Mission Created',
                        description: 'New mission has been created successfully',
                        variant: 'default',
                    });
                    onClose();
                },
            }
        );
    };

    if (!vehicle) return null;

    return (
        <div className="space-y-6 py-4">
            <div>
                <h3 className="text-lg font-medium">Assign Mission</h3>
                <p className="text-sm text-muted-foreground">
                    Create a mission for {vehicle.plate_number}
                </p>
            </div>

            <div className="space-y-4">

                <div className="space-y-2">
                    <Label>Driver</Label>
                    <div className="p-2 bg-muted rounded-md text-sm font-medium">
                        {vehicle.current_driver
                            ? `${vehicle.current_driver.first_name} ${vehicle.current_driver.last_name}`
                            : vehicle.assigned_driver_id
                                ? `${vehicle.assigned_driver_id.first_name} ${vehicle.assigned_driver_id.last_name}`
                                : 'No Driver Assigned'}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mission_type">Mission Type</Label>
                    <Select
                        value={formData.missions}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, missions: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select mission type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Typhoon">Typhoon</SelectItem>
                            <SelectItem value="Vehicle Accident">Vehicle Accident</SelectItem>
                            <SelectItem value="Burning">Burning</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the mission details..."
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                        id="start_time"
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Incident Location</Label>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>Adjust pin to incident location</span>
                        </div>
                        {/* 
                We use the vehicle's location as initial center/marker, 
                but allow user to move it for the "Incident" location.
            */}
                        {/* Re-rendering LocationPicker when vehicle changes is important so we use a key or handled by effect */}
                        <LocationPicker
                            key={vehicle.id}
                            onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, long: lng }))}
                            initialLat={formData.lat}
                            initialLng={formData.long}
                            height="200px"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreateMission} disabled={createMission.isPending}>
                        {createMission.isPending ? 'Creating...' : 'Create Mission'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
