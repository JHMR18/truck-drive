# 🚨 Vehicle Tracking System Schema (Directus)

This schema is designed for a Disaster Risk Management Office vehicle tracking system.  
It supports **Admin** (web interface) and **Driver** (mobile app) workflows.

---

## 📂 Collections (Tables)

### 1. Users
- `id` (PK)
- `name`
- `email`
- `password` (Directus auth)
- `role` (FK → roles)
- `phone_number`
- `status` (Active, Inactive)

### 2. Drivers
- `id` (PK)
- `user_id` (FK → users)
- `license_number`
- `availability_status` (Available, On Mission, Off Duty)
- `assigned_vehicle_id` (FK → vehicles, nullable)
- `performance_score`
- `hours_logged`

### 3. Vehicles
- `id` (PK)
- `plate_number`
- `type` (Ambulance, Fire Truck, Supply Truck, etc.)
- `status` (Idle, Deployed, HQ, Maintenance)
- `assigned_driver_id` (FK → drivers, nullable)
- `last_known_location` (lat, long)
- `fuel_level`
- `maintenance_due_date`

### 4. Missions (Deployments)
- `id` (PK)
- `title`
- `description`
- `status` (Planned, In Progress, Completed, Delayed)
- `start_time`
- `end_time`
- `assigned_vehicle_id` (FK → vehicles)
- `assigned_driver_id` (FK → drivers)
- `created_by` (FK → users)

### 5. Maintenance Logs
- `id` (PK)
- `vehicle_id` (FK → vehicles)
- `issue_reported`
- `reported_date`
- `resolved_date`
- `resolution_notes`
- `reported_by` (FK → users)

### 6. Notifications
- `id` (PK)
- `sender_id` (FK → users)
- `recipient_id` (FK → users)
- `type` (Alert, Broadcast, SOS, Instruction)
- `message`
- `timestamp`
- `status` (Delivered, Read)

### 7. Location Logs
- `id` (PK)
- `vehicle_id` (FK → vehicles)
- `driver_id` (FK → drivers)
- `latitude`
- `longitude`
- `timestamp`
- `speed`
- `heading`

---

## 🔑 Roles & Permissions
- **Super Admin** → Full access
- **Dispatcher** → Manage missions, assign vehicles/drivers
- **Maintenance Officer** → Manage maintenance logs, vehicle status
- **Driver** → Limited access (missions, vehicle status updates, location logs, notifications)

---

## 🧭 Feature Mapping
- **Dashboard Overview** → `vehicles`, `missions`, `drivers`
- **Real-time GPS** → `location_logs`
- **Vehicle Management** → `vehicles`, `maintenance_logs`
- **Driver Management** → `drivers`, `users`
- **Incident & Deployment** → `missions`
- **Notifications** → `notifications`
- **Reports & Analytics** → Aggregates across `missions`, `vehicles`, `drivers`, `maintenance_logs`
