# Vehicle Tracking System - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Directus Backend
```bash
cd truck-drive-directus
docker-compose up -d
```

Directus will be available at: http://localhost:8055

**Default Admin Credentials:**
- Email: admin@admin.com
- Password: adminadmin

### 3. Configure Directus Schema

After starting Directus, you need to create the collections (tables) manually or import a schema snapshot.

#### Manual Setup:

1. Go to http://localhost:8055/admin
2. Login with admin credentials
3. Create the following collections with their fields:

**Collections to create:**
- **users** (use Directus Users - already exists)
- **drivers**
- **vehicles**
- **missions**
- **maintenance_logs**
- **notifications**
- **location_logs**

Refer to `schema.md` for the complete field definitions.

#### Create Roles:

1. Go to Settings → Roles & Permissions
2. Create the following roles:
   - Super Admin (full access)
   - Dispatcher (manage missions, vehicles, drivers)
   - Maintenance Officer (manage maintenance logs, vehicle status)
   - Driver (limited access - missions, vehicle status, notifications)

#### Create Test Users:

1. Create a Driver user:
   - Email: driver@test.com
   - Password: driver123
   - Role: Driver
   - Create a corresponding entry in the `drivers` collection

2. Create an Admin user:
   - Email: admin@test.com
   - Password: admin123
   - Role: Super Admin or Dispatcher

### 4. Start the React App
```bash
npm run dev
```

The app will be available at: http://localhost:5173

## 🎯 Features Implemented

### Admin Features (Super Admin, Dispatcher, Maintenance Officer)
- ✅ Dashboard Overview
- ✅ Vehicle Management (CRUD operations)
- ✅ Driver Management
- ✅ Mission Management (Create, assign, track)
- ✅ Real-time GPS tracking (location_logs)
- ✅ Notifications & Broadcasts
- ✅ Analytics & Reports
- ✅ Role-based access control

### Driver Features
- ✅ Mission Dashboard (view assigned missions)
- ✅ Automatic GPS tracking (real-time location logging)
- ✅ Mission status updates (Start, Complete, Delay)
- ✅ Vehicle status reporting
- ✅ Issue reporting (maintenance logs)
- ✅ Communication (receive alerts, send SOS)
- ✅ Availability status management
- ✅ Performance tracking

## 📱 Mobile-First Design
- Responsive layouts for all screen sizes
- Touch-friendly components
- Mobile navigation with hamburger menu
- Optimized for on-the-go use by drivers

## 🔐 Role-Based Access

### Super Admin
- Full system access
- Manage all users, vehicles, drivers
- View all analytics and reports

### Dispatcher
- Manage missions
- Assign vehicles and drivers
- Track deployments
- Send notifications

### Maintenance Officer
- Manage maintenance logs
- Update vehicle status
- View vehicle health reports

### Driver
- View assigned missions
- Update mission status
- Report vehicle issues
- Send/receive communications
- Auto GPS tracking

## 🗺️ Real-time GPS Tracking

The system automatically tracks driver location when:
1. A driver has an assigned vehicle
2. The driver is logged in on a mobile device
3. Location permissions are granted

Location is logged every 30 seconds to the `location_logs` collection.

## 🔔 Notifications System

Types of notifications:
- **Alert**: Important system alerts
- **Broadcast**: Messages to all users
- **SOS**: Emergency alerts from drivers
- **Instruction**: Direct instructions to specific users

## 📊 Data Collections

All data is stored in Directus collections:
- `users`: User accounts and authentication
- `drivers`: Driver profiles and performance
- `vehicles`: Vehicle inventory and status
- `missions`: Deployment missions
- `maintenance_logs`: Vehicle maintenance records
- `notifications`: Communication system
- `location_logs`: GPS tracking data

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Directus (headless CMS)
- **Database**: SQLite (can be changed to PostgreSQL/MySQL)
- **State Management**: TanStack Query (React Query)
- **Maps**: Leaflet, React-Leaflet
- **Routing**: React Router v6

## 🔧 Configuration

### Environment Variables (.env)
```
VITE_DIRECTUS_URL=http://localhost:8055
```

### Directus Configuration (docker-compose.yml)
- Default admin: admin@admin.com / adminadmin
- CORS enabled for development
- WebSocket support enabled

## 📝 Development Notes

### Adding New Features

1. **Add new data collections**: Create in Directus admin panel
2. **Update types**: Edit `src/lib/directus.ts` to add new types
3. **Create API hooks**: Add to `src/hooks/useDirectusData.ts`
4. **Build UI components**: Create new pages/components
5. **Update routing**: Add routes in `src/App.tsx`

### Testing

Test with different roles:
1. Login as Admin → Full access to all features
2. Login as Driver → Limited to driver-specific features
3. Test GPS tracking → Enable location in browser
4. Test notifications → Send broadcasts, SOS alerts

## 🐛 Troubleshooting

### Directus not starting
```bash
cd truck-drive-directus
docker-compose down
docker-compose up -d
```

### Cannot connect to Directus
- Check if Directus is running: http://localhost:8055
- Verify CORS settings in docker-compose.yml
- Check network connectivity

### GPS not working
- Ensure HTTPS or localhost (required for geolocation API)
- Grant location permissions in browser
- Check browser console for errors

### Login issues
- Verify user exists in Directus
- Check user role is properly assigned
- Clear browser cache/cookies

## 📄 License

This project is built for disaster management and emergency response purposes.
