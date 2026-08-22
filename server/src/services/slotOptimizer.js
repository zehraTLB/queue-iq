import { CLINIC, OVERBOOK_RISK_THRESHOLD, OVERBOOK_MAX_COLLISION } from '../config/clinic.js';
import { ACTIVE_STATUSES, timeToMinutes, minutesToTime } from './scheduling.js';

const URGENCY_RANK = { urgent: 0, soon: 1, routine: 2 };

export function findFreeGaps(appointments, { minDuration = CLINIC.minGapMinutes } = {}) {
  const busy = appointments
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .map((a) => ({ start: timeToMinutes(a.start), end: timeToMinutes(a.start) + a.durationMin }))
    .sort((a, b) => a.start - b.start);

  const blocked = [...busy, { start: CLINIC.lunchStart, end: CLINIC.lunchEnd }].sort(
    (a, b) => a.start - b.start
  );

  const merged = [];
  for (const interval of blocked) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }

  const gaps = [];
  let cursor = CLINIC.openMinutes;
  for (const interval of merged) {
    if (interval.start > cursor) {
      gaps.push({ start: cursor, end: Math.min(interval.start, CLINIC.closeMinutes) });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < CLINIC.closeMinutes) {
    gaps.push({ start: cursor, end: CLINIC.closeMinutes });
  }

  return gaps
    .map((g) => ({
      start: minutesToTime(g.start),
      end: minutesToTime(g.end),
      durationMin: g.end - g.start,
    }))
    .filter((g) => g.durationMin >= minDuration);
}

export function overbookCandidates(appointments) {
  return appointments
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .filter((a) => a.risk && a.risk.score >= OVERBOOK_RISK_THRESHOLD)
    .map((appt) => {
      const noShowProbability = appt.risk.score / 100;
      const collisionProbability = 1 - noShowProbability;
      return {
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        doctorName: appt.doctorName,
        patientName: appt.patientName,
        start: appt.start,
        durationMin: appt.durationMin,
        riskScore: appt.risk.score,
        expectedFreed: Math.round(noShowProbability * 100),
        collisionRisk: Math.round(collisionProbability * 100),
        recommended: collisionProbability <= OVERBOOK_MAX_COLLISION,
        rationale:
          `${appt.patientName} has a ${appt.risk.score}% chance of not attending. ` +
          `Double-booking this slot has a ${Math.round(collisionProbability * 100)}% chance both patients arrive.`,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function matchWaitlist(waitlist, openings) {
  const ranked = [...waitlist].sort((a, b) => {
    const urgency = (URGENCY_RANK[a.urgency] ?? 2) - (URGENCY_RANK[b.urgency] ?? 2);
    if (urgency !== 0) return urgency;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });

  const used = new Set();
  const matches = [];

  for (const opening of openings) {
    const entry = ranked.find(
      (w) =>
        !used.has(w.id) &&
        w.durationMin <= opening.durationMin &&
        (!w.doctorId || w.doctorId === opening.doctorId)
    );
    if (!entry) continue;
    used.add(entry.id);
    matches.push({ opening, entry });
  }

  return matches;
}

export function utilisation(appointments) {
  const active = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const completed = appointments.filter((a) => a.status === 'completed');
  const bookedMinutes = [...active, ...completed].reduce((sum, a) => sum + a.durationMin, 0);
  const capacityMinutes = CLINIC.closeMinutes - CLINIC.openMinutes - (CLINIC.lunchEnd - CLINIC.lunchStart);

  const expectedAttendedMinutes =
    completed.reduce((sum, a) => sum + a.durationMin, 0) +
    active.reduce((sum, a) => sum + a.durationMin * (1 - (a.risk?.score ?? 18) / 100), 0);

  return {
    capacityMinutes,
    bookedMinutes,
    bookedPct: capacityMinutes ? Math.round((bookedMinutes / capacityMinutes) * 100) : 0,
    expectedAttendedPct: capacityMinutes
      ? Math.round((expectedAttendedMinutes / capacityMinutes) * 100)
      : 0,
    projectedLossMinutes: Math.round(bookedMinutes - expectedAttendedMinutes),
  };
}
