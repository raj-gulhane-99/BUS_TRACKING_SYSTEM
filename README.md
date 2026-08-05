# BusTrack — Startup Guide

## Quick Start

### 1. Start MongoDB
Make sure MongoDB is running locally:
```
mongod
```
Or use MongoDB Compass / Atlas.

### 2. Seed the Database
```powershell
cd backend
npm run seed
```

### 3. Start the Backend
```powershell
cd backend
npm run dev
```

### 4. Start the Frontend (new terminal)
```powershell
cd frontend
npm run dev
```

### 5. Open in Browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## Login Credentials (after seeding)

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@school.edu          | admin123    |
| Driver1 | driver1@school.edu        | driver123   |
| Driver2 | driver2@school.edu        | driver123   |
| Driver3 | driver3@school.edu        | driver123   |
| Student | aarav@student.edu         | student123  |
| Student | priya@student.edu         | student123  |
| Student | rohan@student.edu         | student123  |
| (+ 7 more students)                             |

---

## Testing Real-Time Features

1. Open **3 browser tabs**:
   - Tab 1: Login as **Admin** → see Dashboard
   - Tab 2: Login as **Driver** (driver1@school.edu)
   - Tab 3: Login as **Student** (aarav@student.edu)

2. On the **Driver tab** → Toggle "Simulate GPS" → Click **START BUS TRIP**
   - Watch the bus appear on the **Admin** dashboard map (live)
   - Watch the bus appear on the **Student** dashboard map
   - The ETA card on the student view updates in real-time

3. When the simulated bus gets within 500m of a student, a **popup alert** fires automatically.

---

## ESP32 Hardware Integration

The backend `POST /api/gps/update` endpoint accepts real ESP32 GPS data:

```json
POST http://YOUR_SERVER:5000/api/gps/update
Authorization: Bearer <driver_jwt_token>

{
  "busId": "<mongo_bus_id>",
  "driverId": "<mongo_driver_id>",
  "lat": 28.6448,
  "lng": 77.2167,
  "speed": 35.5,
  "heading": 90
}
```

---

## Project Structure

```
bus-tracker/
├── backend/          ← Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── config/   ← MongoDB connection
│   │   ├── controllers/ ← Route handlers
│   │   ├── middleware/  ← JWT auth, role guards
│   │   ├── models/      ← Mongoose schemas
│   │   ├── routes/      ← Express routers
│   │   ├── socket/      ← Socket.IO handlers
│   │   └── utils/       ← ETA calculator
│   ├── seed.js       ← Database seeder
│   ├── server.js     ← Entry point
│   └── .env
│
└── frontend/         ← React + Vite + Tailwind
    ├── src/
    │   ├── api/         ← Axios API calls
    │   ├── components/  ← Map, Sidebar, Cards
    │   ├── context/     ← Auth + Socket providers
    │   ├── hooks/       ← useGeolocation
    │   ├── pages/
    │   │   ├── Admin/   ← Dashboard, Students, Drivers, AssignBus, LiveTracking
    │   │   ├── Driver/  ← DriverDashboard
    │   │   └── Student/ ← StudentDashboard
    │   └── routes/      ← ProtectedRoute
    └── index.html
```
