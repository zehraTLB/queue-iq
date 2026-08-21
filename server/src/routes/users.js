import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';

const router = Router();
const VALID_ROLES = ['doctor', 'staff', 'admin'];

router.get('/me', async (req, res, next) => {
  try {
    const snap = await getDb().collection('users').doc(req.user.uid).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json(snap.data());
  } catch (err) {
    next(err);
  }
});

router.post('/ensure', async (req, res, next) => {
  try {
    const ref = getDb().collection('users').doc(req.user.uid);
    const snap = await ref.get();
    if (snap.exists) {
      return res.json(snap.data());
    }

    const { role, firstName, lastName } = req.body || {};
    const displayName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      req.user.name ||
      req.user.email;

    const profile = {
      uid: req.user.uid,
      email: req.user.email || null,
      displayName,
      role: VALID_ROLES.includes(role) ? role : 'staff',
      createdAt: new Date().toISOString(),
    };

    await ref.set(profile);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
