import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './firebaseAdmin.js';
import { authenticate } from './middleware/auth.js';
import usersRouter from './routes/users.js';
import patientsRouter from './routes/patients.js';
import doctorsRouter from './routes/doctors.js';
import appointmentsRouter from './routes/appointments.js';
import waitlistRouter from './routes/waitlist.js';
import optimizationRouter from './routes/optimization.js';
import eventsRouter from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3001' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/users', authenticate, usersRouter);
app.use('/api/patients', authenticate, patientsRouter);
app.use('/api/doctors', authenticate, doctorsRouter);
app.use('/api/appointments', authenticate, appointmentsRouter);
app.use('/api/waitlist', authenticate, waitlistRouter);
app.use('/api/optimization', authenticate, optimizationRouter);
app.use('/api/events', authenticate, eventsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
});

app.listen(PORT, () => {
  console.log(`queue-iq-server listening on http://localhost:${PORT}`);
});
