# 🚀 Quick Start Guide

## Step-by-Step Setup (5 minutes)

### 1. Install Dependencies (1 min)
```bash
npm install
```

### 2. Start Directus Backend (1 min)
```bash
cd truck-drive-directus
docker-compose up -d
cd ..
```

Wait 30 seconds for Directus to initialize.

### 3. Access Directus Admin (1 min)
Open: http://localhost:8055/admin
Login: **admin@admin.com** / **adminadmin**

### 4. Create Collections (2 min)

Go to **Settings → Data Model**, create these collections:

#### Quick Collection Setup:
1. **driver_profiles**
   - user_id → M2O to directus_users (unique)
   - license_number → String
   - availability_status → Dropdown (Available, On Mission, Off Duty)
   - assigned_vehicle_id → M2O to vehicles
   - performance_score → Integer
   - hours_logged → Integer

2. **vehicles**
   - plate_number → String (unique, required)
   - type → Dropdown (Ambulance, Fire Truck, Supply Truck, etc.)
   - status → Dropdown (Idle, Deployed, HQ, Maintenance)
   - assigned_driver_id → M2O to directus_users
   - last_known_location → JSON
   - fuel_level → Integer
   - maintenance_due_date → Date

3. **missions**
   - title → String (required)
   - description → Text
   - status → Dropdown (Planned, In Progress, Completed, Delayed)
   - start_time → Timestamp
   - end_time → Timestamp
   - assigned_vehicle_id → M2O to vehicles
   - assigned_driver_id → M2O to directus_users
   - created_by → M2O to directus_users

4. **maintenance_logs**
   - vehicle_id → M2O to vehicles (required)
   - issue_reported → Text (required)
   - reported_date → Timestamp (required)
   - resolved_date → Timestamp
   - resolution_notes → Text
   - reported_by → M2O to directus_users

5. **notifications**
   - sender_id → M2O to directus_users
   - recipient_id → M2O to directus_users
   - type → Dropdown (Alert, Broadcast, SOS, Instruction)
   - message → Text (required)
   - timestamp → Timestamp (required)
   - status → Dropdown (Delivered, Read)

6. **location_logs**
   - vehicle_id → M2O to vehicles
   - driver_id → M2O to directus_users
   - latitude → Float (required)
   - longitude → Float (required)
   - timestamp → Timestamp (required)
   - speed → Float
   - heading → Float

### 5. Create Roles

Go to **Settings → Access Control → Roles**, create:
- Super Admin (copy from Administrator)
- Dispatcher
- Maintenance Officer
- Driver

### 6. Create Test Users

Go to **Settings → Access Control → Users**, create:

**Driver User:**
- Email: driver@test.com
- Password: driver123
- First Name: John
- Last Name: Driver
- Role: Driver
- Status: Active

**Admin User:**
- Email: dispatcher@test.com
- Password: dispatcher123
- First Name: Jane
- Last Name: Admin
- Role: Dispatcher
- Status: Active

### 7. Create Sample Data

**Add a vehicle** (Content → vehicles):
```json
{
  "plate_number": "ABC-1234",
  "type": "Ambulance",
  "status": "Idle",
  "fuel_level": 75
}
```

**Add a driver profile** (Content → driver_profiles):
```json
{
  "user_id": "<select John Driver>",
  "license_number": "DL-12345",
  "availability_status": "Available"
}
```

### 8. Start React App
```bash
npm run dev
```

Open: http://localhost:5173

### 9. Test Login

**As Admin:**
- Email: dispatcher@test.com
- Password: dispatcher123
→ You'll see admin dashboard

**As Driver:**
- Email: driver@test.com
- Password: driver123
→ You'll see driver mobile dashboard

---

## 🎯 Quick Test Scenarios

### Scenario 1: Create a Mission (Admin)
1. Login as dispatcher@test.com
2. Go to "Missions"
3. Click "Create Mission"
4. Fill in details, assign vehicle and driver
5. Click "Create Mission"

### Scenario 2: Update Mission Status (Driver)
1. Login as driver@test.com
2. View assigned mission
3. Click "Start Mission"
4. Click "Complete"

### Scenario 3: Send SOS Alert (Driver)
1. Login as driver@test.com
2. Go to "Communication"
3. Click "SEND SOS"
4. Enter emergency message
5. Click "Send Emergency Alert"

### Scenario 4: Report Vehicle Issue (Driver)
1. Login as driver@test.com
2. Go to "Vehicle Status"
3. Click "Report Vehicle Issue"
4. Describe the issue
5. Click "Submit Report"

---

## 📱 Testing GPS Tracking

1. Login as driver
2. Browser will ask for location permission → **Allow**
3. Open browser console (F12)
4. You should see location updates every 30 seconds
5. Check Directus → Content → location_logs to see entries

---

## 🔧 Troubleshooting

### Directus not starting
```bash
cd truck-drive-directus
docker-compose down
docker-compose up -d
```

### Can't login
- Check user exists in Directus
- Verify role is assigned
- Check status is "active"
- Try default: admin@admin.com / adminadmin

### GPS not working
- Must use HTTPS or localhost
- Allow location permissions in browser
- Check browser console for errors

### API errors
- Verify Directus is running: http://localhost:8055
- Check collections are created
- Verify relationships are set up correctly

---

## 📚 Quick Links

- **Directus Admin**: http://localhost:8055/admin
- **React App**: http://localhost:5173
- **API Docs**: http://localhost:8055/docs
- **Full Setup Guide**: See `SETUP.md`
- **Schema Details**: See `DIRECTUS_SCHEMA.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 You're Ready!

The system is now fully set up and ready to use for disaster management vehicle tracking!

**Default Login:** admin@admin.com / adminadmin
