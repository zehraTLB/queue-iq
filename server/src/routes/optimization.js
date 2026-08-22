import { Router } from 'express';
import { getDb } from '../firebaseAdmin.js';
import { fetchHistories } from '../services/history.js';
import { scoreAppointment } from '../services/riskScoring.js';
import { DATE_RE, listAppointmentsForDate } from '../services/scheduling.js';
import { findFreeGaps, overbookCandidates, matchWaitlist, utilisation } from '../services/slotOptimizer.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: 'A date query parameter (YYYY-MM-DD) is required.' });
    }

    const [appointments, doctorSnap, waitlistSnap] = await Promise.all([
      listAppointmentsForDate(date),
      getDb().collection('doctors').orderBy('name').get(),
      getDb().collection('waitlist').where('status', '==', 'waiting').get(),
    ]);

    const histories = await fetchHistories(appointments.map((a) => a.patientId));
    const scored = appointments.map((appt) => ({
      ...appt,
      risk: scoreAppointment(appt, (histories.get(appt.patientId) || []).filter((h) => h.id !== appt.id)),
    }));

    const doctors = doctorSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const waitlist = waitlistSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const byDoctor = doctors.map((doctor) => {
      const own = scored.filter((a) => a.doctorId === doctor.id);
      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty || '',
        appointments: own.length,
        gaps: findFreeGaps(own).map((gap) => ({ ...gap, doctorId: doctor.id, doctorName: doctor.name })),
        utilisation: utilisation(own),
      };
    });

    const openings = byDoctor.flatMap((d) => d.gaps);
    const matches = matchWaitlist(waitlist, openings).map(({ opening, entry }) => ({
      opening,
      entry,
    }));

    res.json({
      date,
      doctors: byDoctor,
      overbooking: overbookCandidates(scored),
      waitlist,
      suggestions: matches,
      totals: utilisation(scored),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
