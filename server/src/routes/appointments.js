import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';
import { fetchHistories } from '../services/history.js';
import { scoreAppointment } from '../services/riskScoring.js';
import {
  ACTIVE_STATUSES,
  ALL_STATUSES as STATUSES,
  DATE_RE,
  TIME_RE,
  timeToMinutes,
  findConflict,
  buildAppointment,
  listAppointmentsForDate,
} from '../services/scheduling.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: 'A date query parameter (YYYY-MM-DD) is required.' });
    }
    const appointments = await listAppointmentsForDate(date);
    const histories = await fetchHistories(appointments.map((a) => a.patientId));
    const scored = appointments.map((appt) => ({
      ...appt,
      risk: scoreAppointment(appt, (histories.get(appt.patientId) || []).filter((h) => h.id !== appt.id)),
    }));

    res.json(scored);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = getDb();
    const { patientId, doctorId, date, start, durationMin = 30, reason = '' } = req.body || {};

    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'Patient and doctor are required.' });
    }
    if (!DATE_RE.test(date || '')) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
    }
    if (!TIME_RE.test(start || '')) {
      return res.status(400).json({ error: 'Start time must be in HH:mm format.' });
    }
    const duration = Number(durationMin);
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      return res.status(400).json({ error: 'Duration must be between 5 and 240 minutes.' });
    }

    const data = await buildAppointment(db, {
      patientId,
      doctorId,
      date,
      start,
      durationMin: duration,
      reason,
      createdBy: req.user.uid,
    });

    if (!req.body.allowOverbook) {
      const conflict = await findConflict(db, { doctorId, date, start, durationMin: duration });
      if (conflict) {
        return res.status(409).json({
          error: `${data.doctorName} already has an appointment at ${conflict.start} on this day.`,
        });
      }
    } else {
      data.overbooked = true;
    }

    const ref = await db.collection('appointments').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const ref = db.collection('appointments').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const current = snap.data();
    const updates = {};
    const { status, date, start, durationMin, reason, doctorId, patientId } = req.body || {};

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }
      updates.status = status;
    }
    if (reason !== undefined) updates.reason = String(reason).trim();
    if (date !== undefined) {
      if (!DATE_RE.test(date)) {
        return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
      }
      updates.date = date;
    }
    if (start !== undefined) {
      if (!TIME_RE.test(start)) {
        return res.status(400).json({ error: 'Start time must be in HH:mm format.' });
      }
      updates.start = start;
    }
    if (durationMin !== undefined) {
      const duration = Number(durationMin);
      if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
        return res.status(400).json({ error: 'Duration must be between 5 and 240 minutes.' });
      }
      updates.durationMin = duration;
    }
    if (doctorId !== undefined) {
      const doctorSnap = await db.collection('doctors').doc(doctorId).get();
      if (!doctorSnap.exists) {
        return res.status(400).json({ error: 'Doctor not found.' });
      }
      updates.doctorId = doctorId;
      updates.doctorName = doctorSnap.data().name;
    }
    if (patientId !== undefined) {
      const patientSnap = await db.collection('patients').doc(patientId).get();
      if (!patientSnap.exists) {
        return res.status(400).json({ error: 'Patient not found.' });
      }
      updates.patientId = patientId;
      updates.patientName = `${patientSnap.data().firstName} ${patientSnap.data().lastName}`;
    }

    const merged = { ...current, ...updates };
    const timingChanged = ['date', 'start', 'durationMin', 'doctorId'].some((f) => updates[f] !== undefined);
    if (timingChanged && ACTIVE_STATUSES.includes(merged.status)) {
      const conflict = await findConflict(db, merged, snap.id);
      if (conflict) {
        return res.status(409).json({
          error: `${merged.doctorName} already has an appointment at ${conflict.start} on this day.`,
        });
      }
    }

    updates.updatedAt = new Date().toISOString();
    await ref.update(updates);
    res.json({ id: snap.id, ...merged, updatedAt: updates.updatedAt });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = getDb().collection('appointments').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    await ref.delete();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
