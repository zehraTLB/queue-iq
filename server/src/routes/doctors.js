import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const snap = await getDb().collection('doctors').orderBy('name').limit(200).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, specialty = '' } = req.body || {};
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Doctor name is required.' });
    }
    const now = new Date().toISOString();
    const data = {
      name: name.trim(),
      specialty: String(specialty).trim(),
      createdAt: now,
      updatedAt: now,
    };
    const ref = await getDb().collection('doctors').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const ref = getDb().collection('doctors').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }
    const updates = {};
    for (const field of ['name', 'specialty']) {
      if (req.body?.[field] !== undefined) updates[field] = String(req.body[field]).trim();
    }
    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ error: 'Doctor name cannot be empty.' });
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
    const ref = getDb().collection('doctors').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }
    await ref.delete();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
