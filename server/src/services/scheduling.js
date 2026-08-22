import { getDb } from '../firebaseAdmin.js';

export const ACTIVE_STATUSES = ['scheduled', 'checked-in'];
export const TERMINAL_STATUSES = ['completed', 'no-show', 'cancelled'];
export const ALL_STATUSES = [...ACTIVE_STATUSES, ...TERMINAL_STATUSES];

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeToMinutes = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins) => {
  const clamped = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

export const overlaps = (startA, durA, startB, durB) =>
  startA < startB + durB && startB < startA + durA;

export async function findConflict(db, { doctorId, date, start, durationMin }, excludeId = null) {
  const snap = await db
    .collection('appointments')
    .where('doctorId', '==', doctorId)
    .where('date', '==', date)
    .get();

  const startMin = timeToMinutes(start);
  for (const doc of snap.docs) {
    if (doc.id === excludeId) continue;
    const appt = doc.data();
    if (!ACTIVE_STATUSES.includes(appt.status)) continue;
    if (overlaps(startMin, durationMin, timeToMinutes(appt.start), appt.durationMin)) {
      return { id: doc.id, ...appt };
    }
  }
  return null;
}

export async function buildAppointment(db, { patientId, doctorId, date, start, durationMin, reason, createdBy }) {
  const [patientSnap, doctorSnap] = await Promise.all([
    db.collection('patients').doc(patientId).get(),
    db.collection('doctors').doc(doctorId).get(),
  ]);

  if (!patientSnap.exists) {
    const error = new Error('Patient not found.');
    error.status = 400;
    throw error;
  }
  if (!doctorSnap.exists) {
    const error = new Error('Doctor not found.');
    error.status = 400;
    throw error;
  }

  const patient = patientSnap.data();
  const now = new Date().toISOString();

  return {
    patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorId,
    doctorName: doctorSnap.data().name,
    date,
    start,
    durationMin,
    reason: String(reason || '').trim(),
    status: 'scheduled',
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listAppointmentsForDate(date) {
  const snap = await getDb().collection('appointments').where('date', '==', date).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}
