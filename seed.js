import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import School from './src/models/School.js';
import Device from './src/models/Device.js';
import Timetable from './src/models/Timetable.js';
import PresetTimetable from './src/models/PresetTimetable.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await School.deleteMany({});
    await Device.deleteMany({});
    await Timetable.deleteMany({});
    await PresetTimetable.deleteMany({});
    console.log('✓ Existing data cleared');

    // Create schools
    console.log('\nCreating schools...');
    const schools = await School.create([
      { name: 'IPRC Kigali TSS' }
    ]);
    console.log(`✓ Created ${schools.length} schools`);

    // Create users
    console.log('\nCreating users...');
    const users = await User.create([
      {
        email: 'admin@bellbot.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        schoolId: null
      },
      {
        email: 'manager1@bellbot.com',
        password: 'manager123',
        name: 'Sarah Manager',
        role: 'manager',
        schoolId: schools[0]._id
      },
      {
        email: 'ringer1@bellbot.com',
        password: 'ringer123',
        name: 'Emily Ringer',
        role: 'ringer',
        schoolId: schools[0]._id
      }
    ]);
    console.log(`✓ Created ${users.length} users`);

    // Create devices
    console.log('\nCreating devices...');
    const devices = await Device.create([
      { serial: 'BELL1001', schoolId: schools[0]._id, location: 'Main Hall', model: 'Standard Bell', status: 'online' }
    ]);
    console.log(`✓ Created ${devices.length} devices`);

    // Create preset timetables
    console.log('\nCreating preset timetables...');
    const presets = await PresetTimetable.create([
      {
        schoolId: schools[0]._id,
        name: 'Regular Schedule',
        description: 'Standard weekday schedule',
        times: [
          { time: '08:30', duration: 5, label: 'First Bell' },
          { time: '10:30', duration: 5, label: 'Break Start' },
          { time: '10:45', duration: 5, label: 'Break End' },
          { time: '12:00', duration: 5, label: 'Lunch Start' },
          { time: '13:00', duration: 5, label: 'Lunch End' },
          { time: '15:30', duration: 5, label: 'End of Day' }
        ]
      },
      {
        schoolId: schools[0]._id,
        name: 'Half Day',
        description: 'Shortened schedule',
        times: [
          { time: '08:30', duration: 5, label: 'First Bell' },
          { time: '10:00', duration: 5, label: 'Break' },
          { time: '12:00', duration: 5, label: 'End of Day' }
        ]
      }
    ]);
    console.log(`✓ Created ${presets.length} preset timetables`);

    // Create default timetables for each school
    console.log('\nCreating default timetables...');
    const timetables = await Timetable.create(
      schools.map(school => ({
        schoolId: school._id,
        updatedBy: users[0]._id,
        weeklySchedule: {
          Monday: {
            presetId: null,
            customTimes: [
              { time: '08:30', duration: 5, label: 'First Bell' },
              { time: '12:00', duration: 5, label: 'Lunch' },
              { time: '15:30', duration: 5, label: 'End of Day' }
            ]
          },
          Tuesday: { presetId: null, customTimes: [] },
          Wednesday: { presetId: null, customTimes: [] },
          Thursday: { presetId: null, customTimes: [] },
          Friday: { presetId: null, customTimes: [] },
          Saturday: { presetId: null, customTimes: [] },
          Sunday: { presetId: null, customTimes: [] }
        }
      }))
    );
    console.log(`✓ Created ${timetables.length} default timetables`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Sample Credentials:');
    console.log('   Admin:    admin@bellbot.com / admin123');
    console.log('   Manager:  manager1@bellbot.com / manager123');
    console.log('   Ringer:   ringer1@bellbot.com / ringer123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
