import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';
import { fetchHistories } from '../services/history.js';
import { patientReliability } from '../services/riskScoring.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const snap = await getDb().collection('patients').orderBy('createdAt', 'desc').limit(200).get();
    const patients = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const histories = await fetchHistories(patients.map((p) => p.id));
    res.json(patients.map((p) => ({ ...p, reliability: patientReliability(histories.get(p.id) || []) })));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { firstName, lastName, phone = '', email = '', dateOfBirth = '', notes = '' } = req.body || {};
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: 'First and last name are required.' });
    }
    const now = new Date().toISOString();
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      dateOfBirth: String(dateOfBirth),
      notes: String(notes),
      createdAt: now,
      updatedAt: now,
    };
    const ref = await getDb().collection('patients').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const ref = getDb().collection('patients').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    const updates = {};
    for (const field of ['firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'notes']) {
      if (req.body?.[field] !== undefined) updates[field] = String(req.body[field]).trim();
    }
    if ((updates.firstName !== undefined && !updates.firstName) || (updates.lastName !== undefined && !updates.lastName)) {
      return res.status(400).json({ error: 'Name fields cannot be empty.' });
    }
    updates.updatedAt = new Date().toISOString();
    await ref.update(updates);
    res.json({ id: snap.id, ...snap.data(), ...updates });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = getDb().collection('patients').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    await ref.delete();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
