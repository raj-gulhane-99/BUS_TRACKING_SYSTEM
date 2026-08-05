/**
 * Seed script — populates the database with sample data for testing.
 * Run: npm run seed
 *
 * Creates:
 *  - 1 Admin
 *  - 3 Drivers
 *  - 10 Students
 *  - 3 Buses
 *  - 3 Routes
 *  - 3 Assignments (driver + bus + route + students)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User        = require('./src/models/User');
const Bus         = require('./src/models/Bus');
const Route       = require('./src/models/Route');
const Assignment  = require('./src/models/Assignment');

// ─── Sample Locations (New Delhi area for demo) ───────────────────────────────
const ROUTES_DATA = [
  {
    name: 'Route A — North Campus',
    description: 'Covers north residential areas',
    stops: [
      { name: 'College Gate (Start)', lat: 28.6448, lng: 77.2167, order: 1 },
      { name: 'Kamla Nagar',          lat: 28.6551, lng: 77.2020, order: 2 },
      { name: 'Hudson Lane',          lat: 28.6799, lng: 77.2089, order: 3 },
      { name: 'GTB Nagar Metro',      lat: 28.6907, lng: 77.2019, order: 4 },
      { name: 'Mukherjee Nagar',      lat: 28.7023, lng: 77.2095, order: 5 },
    ],
    polyline: [
      [28.6448, 77.2167], [28.6551, 77.2020], [28.6799, 77.2089],
      [28.6907, 77.2019], [28.7023, 77.2095],
    ],
    totalDistance: 8.5,
    estimatedTime: 35,
  },
  {
    name: 'Route B — South Campus',
    description: 'Covers south and central areas',
    stops: [
      { name: 'College Gate (Start)', lat: 28.6448, lng: 77.2167, order: 1 },
      { name: 'Connaught Place',      lat: 28.6315, lng: 77.2167, order: 2 },
      { name: 'Lajpat Nagar',         lat: 28.5675, lng: 77.2432, order: 3 },
      { name: 'Saket Metro',          lat: 28.5245, lng: 77.2066, order: 4 },
    ],
    polyline: [
      [28.6448, 77.2167], [28.6315, 77.2167], [28.5675, 77.2432], [28.5245, 77.2066],
    ],
    totalDistance: 12.3,
    estimatedTime: 45,
  },
  {
    name: 'Route C — East Campus',
    description: 'Covers east residential zones',
    stops: [
      { name: 'College Gate (Start)', lat: 28.6448, lng: 77.2167, order: 1 },
      { name: 'Preet Vihar',          lat: 28.6417, lng: 77.2983, order: 2 },
      { name: 'Karkardooma',          lat: 28.6526, lng: 77.3013, order: 3 },
      { name: 'Anand Vihar',          lat: 28.6468, lng: 77.3156, order: 4 },
    ],
    polyline: [
      [28.6448, 77.2167], [28.6417, 77.2983], [28.6526, 77.3013], [28.6468, 77.3156],
    ],
    totalDistance: 9.7,
    estimatedTime: 40,
  },
];

const BUSES_DATA = [
  { busNumber: 'BUS-001', plateNumber: 'DL-01-BT-0001', capacity: 40, model: 'Tata Starbus', color: 'Yellow' },
  { busNumber: 'BUS-002', plateNumber: 'DL-01-BT-0002', capacity: 35, model: 'Ashok Leyland', color: 'Yellow' },
  { busNumber: 'BUS-003', plateNumber: 'DL-01-BT-0003', capacity: 45, model: 'Tata Starbus Ultra', color: 'Yellow' },
];

const DRIVERS_DATA = [
  { name: 'Rajesh Kumar',   email: 'driver1@school.edu', phone: '+91-9876543210', licenseNumber: 'DL-HR-2019-12345', experience: '8 years' },
  { name: 'Suresh Singh',   email: 'driver2@school.edu', phone: '+91-9876543211', licenseNumber: 'DL-UP-2020-67890', experience: '5 years' },
  { name: 'Mahesh Verma',   email: 'driver3@school.edu', phone: '+91-9876543212', licenseNumber: 'DL-DL-2021-11223', experience: '3 years' },
];

const STUDENTS_DATA = [
  { name: 'Aarav Sharma',    email: 'aarav@student.edu',    phone: '+91-9800000001', studentId: 'STU-001', grade: 'Class 10-A', parentContact: '+91-9900000001', address: 'Mukherjee Nagar, Delhi' },
  { name: 'Priya Patel',     email: 'priya@student.edu',    phone: '+91-9800000002', studentId: 'STU-002', grade: 'Class 10-B', parentContact: '+91-9900000002', address: 'GTB Nagar, Delhi' },
  { name: 'Rohan Gupta',     email: 'rohan@student.edu',    phone: '+91-9800000003', studentId: 'STU-003', grade: 'Class 11-A', parentContact: '+91-9900000003', address: 'Hudson Lane, Delhi' },
  { name: 'Sneha Mishra',    email: 'sneha@student.edu',    phone: '+91-9800000004', studentId: 'STU-004', grade: 'Class 11-B', parentContact: '+91-9900000004', address: 'Kamla Nagar, Delhi' },
  { name: 'Vikram Joshi',    email: 'vikram@student.edu',   phone: '+91-9800000005', studentId: 'STU-005', grade: 'Class 12-A', parentContact: '+91-9900000005', address: 'Lajpat Nagar, Delhi' },
  { name: 'Ananya Singh',    email: 'ananya@student.edu',   phone: '+91-9800000006', studentId: 'STU-006', grade: 'Class 12-B', parentContact: '+91-9900000006', address: 'Saket, Delhi' },
  { name: 'Arjun Reddy',     email: 'arjun@student.edu',    phone: '+91-9800000007', studentId: 'STU-007', grade: 'Class 9-A',  parentContact: '+91-9900000007', address: 'Preet Vihar, Delhi' },
  { name: 'Diya Mehta',      email: 'diya@student.edu',     phone: '+91-9800000008', studentId: 'STU-008', grade: 'Class 9-B',  parentContact: '+91-9900000008', address: 'Anand Vihar, Delhi' },
  { name: 'Karan Malhotra',  email: 'karan@student.edu',    phone: '+91-9800000009', studentId: 'STU-009', grade: 'Class 8-A',  parentContact: '+91-9900000009', address: 'Karkardooma, Delhi' },
  { name: 'Meera Iyer',      email: 'meera@student.edu',    phone: '+91-9800000010', studentId: 'STU-010', grade: 'Class 8-B',  parentContact: '+91-9900000010', address: 'Connaught Place, Delhi' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({}),
      Assignment.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'School Admin',
      email: 'admin@school.edu',
      password: 'admin123',
      role: 'admin',
      phone: '+91-9999999999',
    });
    console.log(`👑 Admin created: ${admin.email} / password: admin123`);

    // Create Drivers
    const drivers = await Promise.all(
      DRIVERS_DATA.map(d => User.create({ ...d, password: 'driver123', role: 'driver' }))
    );
    console.log(`🚗 Created ${drivers.length} drivers (password: driver123)`);

    // Create Students
    const students = await Promise.all(
      STUDENTS_DATA.map(s => User.create({ ...s, password: 'student123', role: 'student' }))
    );
    console.log(`🎓 Created ${students.length} students (password: student123)`);

    // Create Routes
    const routes = await Route.insertMany(ROUTES_DATA);
    console.log(`🗺️  Created ${routes.length} routes`);

    // Create Buses
    const buses = await Bus.insertMany(BUSES_DATA);
    console.log(`🚌 Created ${buses.length} buses`);

    // Create Assignments
    const assignments = [
      {
        driver: drivers[0]._id, bus: buses[0]._id, route: routes[0]._id,
        students: [students[0]._id, students[1]._id, students[2]._id, students[3]._id],
      },
      {
        driver: drivers[1]._id, bus: buses[1]._id, route: routes[1]._id,
        students: [students[4]._id, students[5]._id, students[9]._id],
      },
      {
        driver: drivers[2]._id, bus: buses[2]._id, route: routes[2]._id,
        students: [students[6]._id, students[7]._id, students[8]._id],
      },
    ];

    await Assignment.insertMany(assignments);

    // Update buses with driver and route refs
    await Promise.all([
      Bus.findByIdAndUpdate(buses[0]._id, { assignedDriver: drivers[0]._id, assignedRoute: routes[0]._id }),
      Bus.findByIdAndUpdate(buses[1]._id, { assignedDriver: drivers[1]._id, assignedRoute: routes[1]._id }),
      Bus.findByIdAndUpdate(buses[2]._id, { assignedDriver: drivers[2]._id, assignedRoute: routes[2]._id }),
    ]);

    console.log(`📋 Created ${assignments.length} assignments`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('─────────────────────────────────────────────');
    console.log('  Login Credentials:');
    console.log('  Admin:   admin@school.edu    / admin123');
    console.log('  Driver1: driver1@school.edu  / driver123');
    console.log('  Driver2: driver2@school.edu  / driver123');
    console.log('  Driver3: driver3@school.edu  / driver123');
    console.log('  Student: aarav@student.edu   / student123');
    console.log('  (and 9 more students with password: student123)');
    console.log('─────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
