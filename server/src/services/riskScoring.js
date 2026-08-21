export const BASE_NO_SHOW_RATE = 0.18;
export const PRIOR_STRENGTH = 4;

const TERMINAL_STATUSES = ['completed', 'no-show', 'cancelled'];

const WEIGHTS = {
  history: 4.2,
  recentNoShow: 0.9,
  repeatNoShow: 0.55,
  cancellation: 1.3,
  earlySlot: 0.4,
  lateSlot: 0.28,
  mondaySlot: 0.18,
  loyalty: -0.8,
};

const LEAD_TIME_BANDS = [
  { maxDays: 1, weight: -0.3, label: (d) => (d === 0 ? 'Booked same day' : 'Booked one day ahead') },
  { maxDays: 7, weight: 0, label: (d) => `Booked ${d} days in advance` },
  { maxDays: 21, weight: 0.25, label: (d) => `Booked ${d} days in advance` },
  { maxDays: 45, weight: 0.5, label: (d) => `Booked ${d} days in advance` },
  { maxDays: Infinity, weight: 0.65, label: () => 'Booked more than six weeks ahead' },
];

const logit = (p) => Math.log(p / (1 - p));
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const minutesOf = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
};

const daysBetween = (fromIso, toDateStr) => {
  const from = new Date(fromIso);
  const to = new Date(`${toDateStr}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.max(0, Math.round((to - from) / 86400000));
};

export function summarisePatientHistory(history, beforeDate) {
  const past = history
    .filter((a) => TERMINAL_STATUSES.includes(a.status))
    .filter((a) => (beforeDate ? a.date < beforeDate : true))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const attended = past.filter((a) => a.status === 'completed').length;
  const noShows = past.filter((a) => a.status === 'no-show').length;
  const cancellations = past.filter((a) => a.status === 'cancelled').length;
  const decided = attended + noShows;

  const recent = past.slice(0, 3);
  const lastWasNoShow = recent[0]?.status === 'no-show';
  const consecutiveNoShows = (() => {
    let streak = 0;
    for (const appt of past) {
      if (appt.status === 'no-show') streak += 1;
      else if (appt.status === 'completed') break;
    }
    return streak;
  })();

  return {
    total: past.length,
    attended,
    noShows,
    cancellations,
    decided,
    lastWasNoShow,
    consecutiveNoShows,
    observedRate: decided > 0 ? noShows / decided : null,
  };
}

export function scoreAppointment(appointment, history = []) {
  const stats = summarisePatientHistory(history, appointment.date);
  const factors = [];
  let z = logit(BASE_NO_SHOW_RATE);

  const addFactor = (key, label, contribution, detail) => {
    if (!contribution) return;
    factors.push({ key, label, detail, contribution });
    z += contribution;
  };

  const smoothedRate =
    (stats.noShows + PRIOR_STRENGTH * BASE_NO_SHOW_RATE) / (stats.decided + PRIOR_STRENGTH);
  addFactor(
    'history',
    'No-show history',
    WEIGHTS.history * (smoothedRate - BASE_NO_SHOW_RATE),
    stats.decided > 0
      ? `${stats.noShows} missed of ${stats.decided} past appointment${stats.decided === 1 ? '' : 's'}`
      : 'No completed visit history yet'
  );

  if (stats.lastWasNoShow) {
    addFactor('recent', 'Recent behaviour', WEIGHTS.recentNoShow, 'Most recent appointment was a no-show');
  }

  if (stats.consecutiveNoShows > 1) {
    addFactor(
      'streak',
      'Consecutive misses',
      WEIGHTS.repeatNoShow * Math.min(stats.consecutiveNoShows - 1, 3),
      `${stats.consecutiveNoShows} no-shows in a row`
    );
  }

  if (stats.total > 0 && stats.cancellations > 0) {
    const cancelRate = stats.cancellations / stats.total;
    addFactor(
      'cancellations',
      'Cancellation pattern',
      WEIGHTS.cancellation * cancelRate,
      `${stats.cancellations} of ${stats.total} appointments cancelled`
    );
  }

  if (stats.decided >= 4 && stats.noShows === 0) {
    addFactor('loyalty', 'Reliable attendance', WEIGHTS.loyalty, `${stats.attended} visits, never missed`);
  }

  if (appointment.createdAt) {
    const leadDays = daysBetween(appointment.createdAt, appointment.date);
    const band = LEAD_TIME_BANDS.find((b) => leadDays <= b.maxDays);
    addFactor('leadTime', 'Booking lead time', band.weight, band.label(leadDays));
  }

  const startMinutes = minutesOf(appointment.start);
  if (startMinutes < 9 * 60) {
    addFactor('earlySlot', 'Time of day', WEIGHTS.earlySlot, `Early slot at ${appointment.start}`);
  } else if (startMinutes >= 16 * 60) {
    addFactor('lateSlot', 'Time of day', WEIGHTS.lateSlot, `Late slot at ${appointment.start}`);
  }

  const weekday = new Date(`${appointment.date}T00:00:00`).getDay();
  if (weekday === 1) {
    addFactor('weekday', 'Day of week', WEIGHTS.mondaySlot, 'Monday appointments are missed more often');
  }

  const probability = sigmoid(z);
  const score = Math.round(clamp(probability, 0.01, 0.97) * 100);

  const explained = factors.map((factor) => {
    const without = sigmoid(z - factor.contribution);
    return {
      key: factor.key,
      label: factor.label,
      detail: factor.detail,
      impact: Math.round((probability - without) * 100),
    };
  });

  return {
    score,
    band: score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low',
    confidence: stats.decided >= 8 ? 'high' : stats.decided >= 3 ? 'medium' : 'low',
    history: {
      total: stats.total,
      attended: stats.attended,
      noShows: stats.noShows,
      cancellations: stats.cancellations,
      observedRate: stats.observedRate === null ? null : Math.round(stats.observedRate * 100),
    },
    factors: explained
      .filter((f) => f.impact !== 0)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
  };
}

export function patientReliability(history) {
  const stats = summarisePatientHistory(history, null);
  return {
    visits: stats.total,
    attended: stats.attended,
    noShows: stats.noShows,
    cancellations: stats.cancellations,
    noShowRate: stats.observedRate === null ? null : Math.round(stats.observedRate * 100),
  };
}
