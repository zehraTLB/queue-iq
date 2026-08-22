import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';
import { DATE_RE } from '../services/scheduling.js';

const router = Router();
const HEARTBEAT_MS = 25000;

const channels = new Map();

function getChannel(date) {
  if (channels.has(date)) return channels.get(date);

  const channel = { clients: new Set(), unsubscribes: [] };

  const broadcast = (payload) => {
    const frame = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of channel.clients) {
      client.write(frame);
    }
  };

  let appointmentsReady = false;
  let waitlistReady = false;

  channel.unsubscribes.push(
    getDb()
      .collection('appointments')
      .where('date', '==', date)
      .onSnapshot(
        (snap) => {
          if (!appointmentsReady) {
            appointmentsReady = true;
            return;
          }
          broadcast({ type: 'appointments', date, changes: snap.docChanges().length });
        },
        (err) => broadcast({ type: 'error', message: err.message })
      )
  );

  channel.unsubscribes.push(
    getDb()
      .collection('waitlist')
      .where('status', '==', 'waiting')
      .onSnapshot(
        (snap) => {
          if (!waitlistReady) {
            waitlistReady = true;
            return;
          }
          broadcast({ type: 'waitlist', changes: snap.docChanges().length });
        },
        (err) => broadcast({ type: 'error', message: err.message })
      )
  );

  channels.set(date, channel);
  return channel;
}

function releaseChannel(date) {
  const channel = channels.get(date);
  if (!channel || channel.clients.size > 0) return;
  channel.unsubscribes.forEach((fn) => fn());
  channels.delete(date);
}

router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date || !DATE_RE.test(date)) {
    return res.status(400).json({ error: 'A date query parameter (YYYY-MM-DD) is required.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected', date })}\n\n`);
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const channel = getChannel(date);
  channel.clients.add(res);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    channel.clients.delete(res);
    releaseChannel(date);
  });
});

export default router;
