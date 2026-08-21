import { isFirebaseReady, getAuth } from '../firebaseAdmin.js';

export async function authenticate(req, res, next) {
  if (!isFirebaseReady()) {
    return res.status(503).json({
      error: 'Server is not connected to Firebase. Add serviceAccountKey.json and restart.',
    });
  }

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    req.user = await getAuth().verifyIdToken(match[1]);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
