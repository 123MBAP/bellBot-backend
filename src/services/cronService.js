import cron from 'node-cron';
import { mqttService } from './mqttService.js';

const KIGALI_TIMEZONE = 'Africa/Kigali'; // GMT+2

export function startCronJobs() {
  // Run every day at 01:30 AM Kigali time
  cron.schedule('30 1 * * *', async () => {
    console.log('[Cron] 01:30 AM — triggering nightly timetable push...');
    await mqttService.pushAllTimetables();
  }, { timezone: KIGALI_TIMEZONE });

  console.log('✓ Cron jobs scheduled (nightly timetable push at 01:30 Africa/Kigali)');
}
