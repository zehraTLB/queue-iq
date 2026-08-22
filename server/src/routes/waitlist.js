import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';
import {
  DATE_RE,
  TIME_RE,
  findConflict,
  buildAppointment,
} from '../services/scheduling.js';

const router = Router();
const URGENCIES = ['routine', 'soon', 'urgent'];

router.get('/', async (req, res, next) => {
  try {
    const snap = await getDb().collection('waitlist').where('status', '==', 'waiting').get();
    const entries = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = getDb();
    const { patientId, doctorId = null, reason = '', durationMin = 30, urgency = 'routine', notes = '' } = req.body || {};

    if (!patientId) {
      return res.status(400).json({ error: 'A patient is required.' });
    }
    if (!URGENCIES.includes(urgency)) {
      return res.status(400).json({ error: 'Invalid urgency.' });
    }
    const duration = Number(durationMin);
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      return res.status(400).json({ error: 'Duration must be between 5 and 240 minutes.' });
    }

    const patientSnap = await db.collection('patients').doc(patientId).get();
    if (!patientSnap.exists) {
      return res.status(400).json({ error: 'Patient not found.' });
    }

    let doctorName = null;
    if (doctorId) {
      const doctorSnap = await db.collection('doctors').doc(doctorId).get();
      if (!doctorSnap.exists) {
        return res.status(400).json({ error: 'Doctor not found.' });
      }
      doctorName = doctorSnap.data().name;
    }

    const patient = patientSnap.data();
    const data = {
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId,
      doctorName,
      reason: String(reason).trim(),
      durationMin: duration,
      urgency,
      notes: String(notes).trim(),
      status: 'waiting',
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('waitlist').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/book', async (req, res, next) => {
  try {
    const db = getDb();
    const entryRef = db.collection('waitlist').doc(req.params.id);
    const entrySnap = await entryRef.get();
    if (!entrySnap.exists) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }

    const entry = entrySnap.data();
    if (entry.status !== 'waiting') {
      return res.status(409).json({ error: 'This waitlist entry has already been handled.' });
    }

    const { date, start, doctorId = entry.doctorId, allowOverbook = false } = req.body || {};
    if (!DATE_RE.test(date || '')) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
    }
    if (!TIME_RE.test(start || '')) {
      return res.status(400).json({ error: 'Start time must be in HH:mm format.' });
    }
    if (!doctorId) {
      return res.status(400).json({ error: 'A doctor is required to book this entry.' });
    }

    const appointment = await buildAppointment(db, {
      patientId: entry.patientId,
      doctorId,
      date,
      start,
      durationMin: entry.durationMin,
      reason: entry.reason,
      createdBy: req.user.uid,
    });

    if (!allowOverbook) {
      const conflict = await findConflict(db, { doctorId, date, start, durationMin: entry.durationMin });
      if (conflict) {
        return res.status(409).json({
          error: `${appointment.doctorName} already has an appointment at ${conflict.start} on this day.`,
        });
      }
    } else {
      appointment.overbooked = true;
    }

    appointment.fromWaitlistId = entrySnap.id;

    const created = await db.collection('appointments').add(appointment);
    await entryRef.update({
      status: 'booked',
      bookedAppointmentId: created.id,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ id: created.id, ...appointment });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = getDb().collection('waitlist').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }
    await ref.delete();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
