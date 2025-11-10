# Directus Schema Setup Instructions

This file contains the setup instructions for the updated schema using Directus built-in users.

## 📂 Schema Overview

This schema uses **Directus built-in users** (`directus_users`) instead of a separate users table.
Drivers and Admins are differentiated by their **role** field.

## Option 1: Using Directus Admin UI

1. Start Directus: `cd truck-drive-directus && docker-compose up -d`
2. Go to http://localhost:8055/admin
3. Login with admin@admin.com / adminadmin
4. Navigate to Settings → Data Model
5. Create each collection manually using the specifications below

## Collections Schema

### 1. Users (Directus Built-in: `directus_users`)

**Extend with custom fields:**
- `phone_number` (String, nullable)

All drivers and admins are stored in this collection, differentiated by role.

### 2. Driver Profiles Collection (Optional Extension)

```
Collection Name: driver_profiles
Fields:
- id (UUID, Primary Key, Auto-generated)
- user_id (Many-to-One relationship to directus_users, unique)
- license_number (String)
- availability_status (Dropdown: Available, On Mission, Off Duty)
- assigned_vehicle_id (Many-to-One relationship to vehicles, nullable)
- performance_score (Integer, nullable, 0-100)
- hours_logged (Integer, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

**Note**: Only create a driver_profile entry for users with role=Driver

### 3. Vehicles Collection

```
Collection Name: vehicles
Fields:
- id (UUID, Primary Key, Auto-generated)
- plate_number (String, Required, Unique)
- type (Dropdown: Ambulance, Fire Truck, Supply Truck, Rescue Vehicle, Command Vehicle, Other)
- status (Dropdown: Idle, Deployed, HQ, Maintenance)
- assigned_driver_id (Many-to-One relationship to directus_users, nullable)
  Filter: Show only users with role=Driver
- last_known_location (JSON, nullable)
  Structure: { "lat": number, "lng": number }
- fuel_level (Integer, nullable, 0-100)
- maintenance_due_date (Date, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 4. Missions Collection

```
Collection Name: missions
Fields:
- id (UUID, Primary Key, Auto-generated)
- title (String, Required)
- description (Text, nullable)
- status (Dropdown: Planned, In Progress, Completed, Delayed)
- start_time (Timestamp, nullable)
- end_time (Timestamp, nullable)
- assigned_vehicle_id (Many-to-One relationship to vehicles, nullable)
- assigned_driver_id (Many-to-One relationship to directus_users, nullable)
  Filter: Show only users with role=Driver
- created_by (Many-to-One relationship to directus_users, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 5. Maintenance Logs Collection

```
Collection Name: maintenance_logs
Fields:
- id (UUID, Primary Key, Auto-generated)
- vehicle_id (Many-to-One relationship to vehicles, Required)
- issue_reported (Text, Required)
- reported_date (Timestamp, Required)
- resolved_date (Timestamp, nullable)
- resolution_notes (Text, nullable)
- reported_by (Many-to-One relationship to directus_users, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 6. Notifications Collection

```
Collection Name: notifications
Fields:
- id (UUID, Primary Key, Auto-generated)
- sender_id (Many-to-One relationship to directus_users, nullable)
- recipient_id (Many-to-One relationship to directus_users, nullable)
- type (Dropdown: Alert, Broadcast, SOS, Instruction)
- message (Text, Required)
- timestamp (Timestamp, Required)
- status (Dropdown: Delivered, Read)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 7. Location Logs Collection

```
Collection Name: location_logs
Fields:
- id (UUID, Primary Key, Auto-generated)
- vehicle_id (Many-to-One relationship to vehicles, nullable)
- driver_id (Many-to-One relationship to directus_users, nullable)
  Filter: Show only users with role=Driver
- latitude (Float, Required)
- longitude (Float, Required)
- timestamp (Timestamp, Required)
- speed (Float, nullable)
- heading (Float, nullable)
- date_created (Timestamp, Auto-generated)
```

## Roles & Permissions Setup

### 1. Create Roles

Go to Settings → Access Control → Roles, create:

1. **Super Admin**
   - All permissions: Create, Read, Update, Delete
   - All collections
   - System collections access

2. **Dispatcher**
   - missions: Full CRUD
   - vehicles: Full CRUD
   - directus_users: Read (Driver role only), Update (status, assignments)
   - driver_profiles: Read, Update
   - location_logs: Read only
   - notifications: Full CRUD
   - maintenance_logs: Read only

3. **Maintenance Officer**
   - vehicles: Read, Update
   - maintenance_logs: Full CRUD
   - directus_users: Read only
   - driver_profiles: Read only
   - notifications: Read only

4. **Driver** (Most Restricted)
   - missions: Read only (filter: assigned_driver_id = $CURRENT_USER)
   - vehicles: Read only (filter: assigned_driver_id = $CURRENT_USER)
   - driver_profiles: Read, Update (filter: user_id = $CURRENT_USER)
   - location_logs: Create only
   - notifications: Read (filter: recipient_id = $CURRENT_USER), Create
   - maintenance_logs: Create only
   - directus_users: Read (own profile only)

### 2. User Creation Flow

For each user:
1. Create in Settings → Access Control → Users
2. Fill in: first_name, last_name, email, password, phone_number
3. Assign appropriate role
4. Set status to "active"
5. **If role is "Driver"**: Also create entry in `driver_profiles` collection with reference to user_id

## Sample Data

### Sample Super Admin User
```json
{
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "<Super Admin role UUID>",
  "phone_number": "+63 912 345 6789",
  "status": "active"
}
```

### Sample Driver User
```json
{
  "first_name": "John",
  "last_name": "Driver",
  "email": "driver@test.com",
  "password": "driver123",
  "role": "<Driver role UUID>",
  "phone_number": "+63 912 345 6789",
  "status": "active"
}
```

### Sample Driver Profile (for the driver above)
```json
{
  "user_id": "<driver-user-uuid>",
  "license_number": "N01-12-345678",
  "availability_status": "Available",
  "performance_score": 95,
  "hours_logged": 120
}
```

### Sample Vehicle
```json
{
  "plate_number": "ABC-1234",
  "type": "Ambulance",
  "status": "Idle",
  "assigned_driver_id": "<driver-user-uuid>",
  "fuel_level": 75,
  "maintenance_due_date": "2025-12-31"
}
```

### Sample Mission
```json
{
  "title": "Emergency Medical Response",
  "description": "Transport patient to hospital",
  "status": "Planned",
  "start_time": "2025-11-09T08:00:00Z",
  "assigned_vehicle_id": "<vehicle-uuid>",
  "assigned_driver_id": "<driver-user-uuid>",
  "created_by": "<admin-user-uuid>"
}
```

## Testing Checklist

- [ ] Create all collections (driver_profiles, vehicles, missions, maintenance_logs, notifications, location_logs)
- [ ] Add phone_number field to directus_users
- [ ] Set up relationships between collections
- [ ] Create roles (Super Admin, Dispatcher, Maintenance Officer, Driver)
- [ ] Configure permissions for each role
- [ ] Create test users for each role
- [ ] For driver users, create corresponding driver_profiles entries
- [ ] Create test data (vehicles, missions)
- [ ] Test login with different roles
- [ ] Verify role-based access control
- [ ] Test GPS tracking (location_logs creation)
- [ ] Test notifications system

## Key Differences from Previous Schema

1. ✅ **No separate users table** - Uses directus_users
2. ✅ **driver_profiles is optional** - Only for driver-specific metadata
3. ✅ **All FKs point to directus_users** - Simplified relationships
4. ✅ **Role-based filtering** - Use Directus permissions to filter by role
5. ✅ **first_name, last_name** - Instead of single "name" field

## Notes

- All timestamps use ISO 8601 format
- UUIDs are auto-generated by Directus
- Many-to-One relationships create foreign keys automatically
- JSON fields (like last_known_location) should be valid JSON objects
- Dropdown fields are defined as String with predefined options
- Use Directus role filters to restrict driver-specific queries

## Option 1: Using Directus Admin UI

1. Start Directus: `cd truck-drive-directus && docker-compose up -d`
2. Go to http://localhost:8055/admin
3. Login with admin@admin.com / adminadmin
4. Navigate to Settings → Data Model
5. Create each collection manually using the specifications below

## Option 2: Direct Database Setup

If using SQLite (default), you can access the database directly:

```bash
cd truck-drive-directus/database
sqlite3 data.db
```

Then run the SQL commands below.

## Collections Schema

### 1. Drivers Collection

```
Collection Name: drivers
Fields:
- id (UUID, Primary Key, Auto-generated)
- user_id (Many-to-One relationship to directus_users)
- license_number (String)
- availability_status (Dropdown: Available, On Mission, Off Duty)
- assigned_vehicle_id (Many-to-One relationship to vehicles, nullable)
- performance_score (Integer, nullable)
- hours_logged (Integer, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 2. Vehicles Collection

```
Collection Name: vehicles
Fields:
- id (UUID, Primary Key, Auto-generated)
- plate_number (String, Required, Unique)
- type (Dropdown: Ambulance, Fire Truck, Supply Truck, Rescue Vehicle, Command Vehicle, Other)
- status (Dropdown: Idle, Deployed, HQ, Maintenance)
- assigned_driver_id (Many-to-One relationship to drivers, nullable)
- last_known_location (JSON, nullable)
  Structure: { "lat": number, "lng": number }
- fuel_level (Integer, nullable, 0-100)
- maintenance_due_date (Date, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 3. Missions Collection

```
Collection Name: missions
Fields:
- id (UUID, Primary Key, Auto-generated)
- title (String, Required)
- description (Text, nullable)
- status (Dropdown: Planned, In Progress, Completed, Delayed)
- start_time (Timestamp, nullable)
- end_time (Timestamp, nullable)
- assigned_vehicle_id (Many-to-One relationship to vehicles, nullable)
- assigned_driver_id (Many-to-One relationship to drivers, nullable)
- created_by (Many-to-One relationship to directus_users, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 4. Maintenance Logs Collection

```
Collection Name: maintenance_logs
Fields:
- id (UUID, Primary Key, Auto-generated)
- vehicle_id (Many-to-One relationship to vehicles, Required)
- issue_reported (Text, Required)
- reported_date (Timestamp, Required)
- resolved_date (Timestamp, nullable)
- resolution_notes (Text, nullable)
- reported_by (Many-to-One relationship to directus_users, nullable)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 5. Notifications Collection

```
Collection Name: notifications
Fields:
- id (UUID, Primary Key, Auto-generated)
- sender_id (Many-to-One relationship to directus_users, nullable)
- recipient_id (Many-to-One relationship to directus_users, nullable)
- type (Dropdown: Alert, Broadcast, SOS, Instruction)
- message (Text, Required)
- timestamp (Timestamp, Required)
- status (Dropdown: Delivered, Read)
- date_created (Timestamp, Auto-generated)
- date_updated (Timestamp, Auto-generated)
```

### 6. Location Logs Collection

```
Collection Name: location_logs
Fields:
- id (UUID, Primary Key, Auto-generated)
- vehicle_id (Many-to-One relationship to vehicles, nullable)
- driver_id (Many-to-One relationship to drivers, nullable)
- latitude (Float, Required)
- longitude (Float, Required)
- timestamp (Timestamp, Required)
- speed (Float, nullable)
- heading (Float, nullable)
- date_created (Timestamp, Auto-generated)
```

## Roles & Permissions Setup

### 1. Create Roles

Go to Settings → Roles & Permissions, create:

1. **Super Admin**
   - All permissions: Create, Read, Update, Delete
   - All collections

2. **Dispatcher**
   - missions: Full CRUD
   - vehicles: Full CRUD
   - drivers: Full CRUD
   - location_logs: Read only
   - notifications: Full CRUD
   - maintenance_logs: Read only

3. **Maintenance Officer**
   - vehicles: Read, Update
   - maintenance_logs: Full CRUD
   - drivers: Read only
   - notifications: Read only

4. **Driver** (Most Restricted)
   - missions: Read only (filter: assigned_driver_id = $CURRENT_USER.driver_id)
   - vehicles: Read only (filter: assigned_driver_id = $CURRENT_USER.driver_id)
   - drivers: Read, Update (filter: user_id = $CURRENT_USER)
   - location_logs: Create only
   - notifications: Read (filter: recipient_id = $CURRENT_USER), Create
   - maintenance_logs: Create only

### 2. User Creation Flow

For each user:
1. Create in directus_users (Directus built-in collection)
2. Assign appropriate role
3. If role is "Driver", also create entry in `drivers` collection with reference to user_id

## Sample Data

### Sample Vehicle
```json
{
  "plate_number": "ABC-1234",
  "type": "Ambulance",
  "status": "Idle",
  "fuel_level": 75,
  "maintenance_due_date": "2025-12-31"
}
```

### Sample Driver
```json
{
  "user_id": "<user-uuid>",
  "license_number": "N01-12-345678",
  "availability_status": "Available",
  "performance_score": 95,
  "hours_logged": 120
}
```

### Sample Mission
```json
{
  "title": "Emergency Medical Response",
  "description": "Transport patient to hospital",
  "status": "Planned",
  "start_time": "2025-11-09T08:00:00Z",
  "assigned_vehicle_id": "<vehicle-uuid>",
  "assigned_driver_id": "<driver-uuid>"
}
```

## Quick Start Script

After Directus is running, you can use the Directus API to create collections programmatically.

See the Directus documentation: https://docs.directus.io/reference/system/collections.html

## Testing Checklist

- [ ] Create all collections
- [ ] Set up relationships between collections
- [ ] Create roles (Super Admin, Dispatcher, Maintenance Officer, Driver)
- [ ] Configure permissions for each role
- [ ] Create test users for each role
- [ ] Create test data (vehicles, drivers, missions)
- [ ] Test login with different roles
- [ ] Verify role-based access control
- [ ] Test GPS tracking (location_logs creation)
- [ ] Test notifications system

## Notes

- All timestamps use ISO 8601 format
- UUIDs are auto-generated by Directus
- Many-to-One relationships create foreign keys automatically
- JSON fields (like last_known_location) should be valid JSON objects
- Dropdown fields are defined as String with predefined options
