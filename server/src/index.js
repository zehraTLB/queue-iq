import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './firebaseAdmin.js';
import { authenticate } from './middleware/auth.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3100' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/users', authenticate, usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`queue-iq-server listening on http://localhost:${PORT}`);
});
