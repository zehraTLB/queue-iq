import { getDb, isFirebaseReady } from '../src/firebaseAdmin.js';

const DEMO_FLAG = 'demoSeed';

const DOCTORS = [
  { name: 'Dr. Aysel Mammadova', specialty: 'General Practice' },
  { name: 'Dr. Kamran Huseynov', specialty: 'Cardiology' },
  { name: 'Dr. Nigar Safarova', specialty: 'Dermatology' },
];

const PATIENTS = [
  { firstName: 'Leyla', lastName: 'Aliyeva', phone: '+994 50 123 45 67', pattern: 'reliable' },
  { firstName: 'Orxan', lastName: 'Qasimov', phone: '+994 55 222 11 09', pattern: 'chronic' },
  { firstName: 'Nurlan', lastName: 'Ismayilov', phone: '+994 51 908 33 12', pattern: 'occasional' },
  { firstName: 'Sevda', lastName: 'Rahimova', phone: '+994 70 444 55 66', pattern: 'canceller' },
  { firstName: 'Tural', lastName: 'Bayramov', phone: '+994 77 310 24 88', pattern: 'new' },
  { firstName: 'Gunel', lastName: 'Hasanova', phone: '+994 50 777 12 34', pattern: 'reliable' },
];

const PATTERNS = {
  reliable: ['completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
  chronic: ['no-show', 'no-show', 'completed', 'no-show', 'completed', 'no-show'],
  occasional: ['completed', 'completed', 'no-show', 'completed', 'completed'],
  canceller: ['cancelled', 'completed', 'cancelled', 'completed', 'cancelled'],
  new: [],
};

const REASONS = [
  'Annual check-up',
  'Follow-up consultation',
  'Blood pressure review',
  'Skin examination',
  'Lab results review',
  'Prescription renewal',
];

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const shiftDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function clearDemoData(db) {
  let removed = 0;
  for (const collection of ['appointments', 'patients', 'doctors']) {
    const snap = await db.collection(collection).where(DEMO_FLAG, '==', true).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    if (snap.size > 0) await batch.commit();
    removed += snap.size;
  }
  return removed;
}

async function seed(db) {
  const now = new Date().toISOString();

  const doctorRefs = [];
  for (const doctor of DOCTORS) {
    const ref = await db.collection('doctors').add({
      ...doctor,
      [DEMO_FLAG]: true,
      createdAt: now,
      updatedAt: now,
    });
    doctorRefs.push({ id: ref.id, ...doctor });
  }

  let appointmentCount = 0;

  for (const [index, patient] of PATIENTS.entries()) {
    const { pattern, ...fields } = patient;
    const patientRef = await db.collection('patients').add({
      ...fields,
      email: `${fields.firstName.toLowerCase()}@example.com`,
      dateOfBirth: `19${70 + index * 4}-0${(index % 9) + 1}-1${index % 9}`,
      notes: '',
      [DEMO_FLAG]: true,
      createdAt: now,
      updatedAt: now,
    });

    const statuses = PATTERNS[pattern];
    for (const [i, status] of statuses.entries()) {
      const daysAgo = (statuses.length - i) * 24 + (index % 7);
      const apptDate = shiftDays(-daysAgo);
      const doctor = doctorRefs[(index + i) % doctorRefs.length];
      const bookedAt = shiftDays(-daysAgo - (5 + (i % 3) * 6));

      await db.collection('appointments').add({
        patientId: patientRef.id,
        patientName: `${fields.firstName} ${fields.lastName}`,
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: toDateStr(apptDate),
        start: `${pad(9 + ((i * 2) % 8))}:${i % 2 ? '30' : '00'}`,
        durationMin: 30,
        reason: REASONS[(index + i) % REASONS.length],
        status,
        createdBy: 'demo-seed',
        [DEMO_FLAG]: true,
        createdAt: bookedAt.toISOString(),
        updatedAt: apptDate.toISOString(),
      });
      appointmentCount += 1;
    }

    const upcomingSlot = 9 + index;
    const leadDays = [0, 26, 3, 14, 1, 9][index % 6];
    await db.collection('appointments').add({
      patientId: patientRef.id,
      patientName: `${fields.firstName} ${fields.lastName}`,
      doctorId: doctorRefs[index % doctorRefs.length].id,
      doctorName: doctorRefs[index % doctorRefs.length].name,
      date: toDateStr(new Date()),
      start: `${pad(upcomingSlot)}:${index % 2 ? '30' : '00'}`,
      durationMin: 30,
      reason: REASONS[index % REASONS.length],
      status: 'scheduled',
      createdBy: 'demo-seed',
      [DEMO_FLAG]: true,
      createdAt: shiftDays(-leadDays).toISOString(),
      updatedAt: now,
    });
    appointmentCount += 1;
  }

  return { doctors: DOCTORS.length, patients: PATIENTS.length, appointments: appointmentCount };
}

async function main() {
  if (!isFirebaseReady()) {
    console.error('Firebase Admin is not configured. Add server/serviceAccountKey.json first.');
    process.exit(1);
  }

  const db = getDb();
  const clearOnly = process.argv.includes('--clear');

  const removed = await clearDemoData(db);
  console.log(`Removed ${removed} existing demo document(s).`);

  if (clearOnly) {
    console.log('Demo data cleared.');
    process.exit(0);
  }

  const result = await seed(db);
  console.log(
    `Seeded ${result.doctors} doctors, ${result.patients} patients, ${result.appointments} appointments.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
