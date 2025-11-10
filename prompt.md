# 📱 AI Development Prompt: Unified React Mobile App for Vehicle Tracking System

You are tasked with modifying the existing React project to integrate the new **Directus schema** and implement role-based features for both **Admin** and **Driver** users.  
The app is mobile-first and must adapt its interface depending on the logged-in user’s role.

---

## ✅ Tasks

### 1. Database & Backend Integration
- Connect the React app to the Directus backend using the provided schema.
- Implement authentication and role-based access (Super Admin, Dispatcher, Maintenance Officer, Driver).
- Ensure API endpoints are secured and return only relevant data per role.

### 2. Role-Based UI & Navigation
- Create a **role-aware navigation system**:
  - Admin → Dashboard, Vehicle Management, Driver Management, Missions, Notifications, Reports.
  - Driver → Mission Dashboard, Vehicle Status, Communication, Profile & History.
- Use conditional rendering to show/hide features based on role.
- Ensure consistent mobile-first design (responsive layouts, touch-friendly components).

### 3. Admin Features
- **Dashboard Overview**: Vehicle status summary, real-time GPS map, quick statistics.
- **Vehicle Management**: CRUD vehicles, assign drivers, track maintenance.
- **Driver Management**: Create/manage driver accounts, assign vehicles, view logs.
- **Missions**: Create deployments, assign vehicles/drivers, track progress.
- **Notifications**: Receive alerts, send broadcast messages.
- **Reports**: Generate/export reports on usage, fuel, activity, response times.

### 4. Driver Features
- **Automatic GPS Tracking**: Send real-time location tied to assigned vehicle.
- **Mission Dashboard**: View missions, update status (In Progress, Completed, Delayed).
- **Vehicle Status Updates**: Report issues, update availability.
- **Communication**: Receive alerts, send quick messages or SOS.
- **Profile & History**: View driving history, update contact info and availability.

### 5. System-Wide Features
- Implement push notifications for alerts and mission updates.
- Synchronize GPS tracking with `location_logs`.
- Ensure offline support (local caching of missions and status updates).
- Provide audit-ready data exports.

---

## 📂 Directus Schema

### Users
- `id` (PK)
- `name`
- `email`
- `password` (Directus auth)
- `role` (FK → roles)
- `phone_number`
- `status` (Active, Inactive)

### Drivers
- `id` (PK)
- `user_id` (FK → users)
- `license_number`
- `availability_status` (Available, On Mission, Off Duty)
- `assigned_vehicle_id` (FK → vehicles, nullable)
- `performance_score`
- `hours_logged`

### Vehicles
- `id` (PK)
- `plate_number`
- `type` (Ambulance, Fire Truck, Supply Truck, etc.)
- `status` (Idle, Deployed, HQ, Maintenance)
- `assigned_driver_id` (FK → drivers, nullable)
- `last_known_location` (lat, long)
- `fuel_level`
- `maintenance_due_date`

### Missions (Deployments)
- `id` (PK)
- `title`
- `description`
- `status` (Planned, In Progress, Completed, Delayed)
- `start_time`
- `end_time`
- `assigned_vehicle_id` (FK → vehicles)
- `assigned_driver_id` (FK → drivers)
- `created_by` (FK → users)

### Maintenance Logs
- `id` (PK)
- `vehicle_id` (FK → vehicles)
- `issue_reported`
- `reported_date`
- `resolved_date`
- `resolution_notes`
- `reported_by` (FK → users)

### Notifications
- `id` (PK)
- `sender_id` (FK → users)
- `recipient_id` (FK → users)
- `type` (Alert, Broadcast, SOS, Instruction)
- `message`
- `timestamp`
- `status` (Delivered, Read)

### Location Logs
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

## 🎯 Goal
Deliver a **single React mobile app** that dynamically adapts to the logged-in user’s role (Admin or Driver), powered by Directus backend, with real-time GPS tracking, mission management, and disaster response workflows.