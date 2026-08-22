import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  Clock,
  Trash2,
  Zap,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/ToastProvider';
import useLiveUpdates from '../../hooks/useLiveUpdates';
import {
  getOptimization,
  listPatients,
  listDoctors,
  addToWaitlist,
  bookFromWaitlist,
  removeFromWaitlist,
} from '../../api/resources';
import './OptimizerPage.scss';

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

const URGENCIES = [
  { id: 'routine', label: 'Routine' },
  { id: 'soon', label: 'Soon' },
  { id: 'urgent', label: 'Urgent' },
];

const EMPTY_WAITLIST_FORM = {
  patientId: '',
  doctorId: '',
  reason: '',
  durationMin: 30,
  urgency: 'routine',
  notes: '',
};

export default function OptimizerPage() {
  const showToast = useToast();
  const [date, setDate] = useState(toDateStr(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [waitlistModal, setWaitlistModal] = useState(false);
  const [form, setForm] = useState(EMPTY_WAITLIST_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setData(await getOptimization(date));
      } catch (err) {
        showToast(err.message, false);
      }
      if (!silent) setLoading(false);
    },
    [date, showToast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const live = useLiveUpdates(date, () => load(true));

  useEffect(() => {
    Promise.all([listPatients(), listDoctors()])
      .then(([p, d]) => {
        setPatients(p);
        setDoctors(d);
      })
      .catch((err) => showToast(err.message, false));
  }, [showToast]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAddWaitlist = async (e) => {
    e.preventDefault();
    if (!form.patientId) {
      showToast('Please select a patient.', false);
      return;
    }
    setSaving(true);
    try {
      await addToWaitlist({
        ...form,
        doctorId: form.doctorId || null,
        durationMin: Number(form.durationMin),
      });
      setWaitlistModal(false);
      setForm(EMPTY_WAITLIST_FORM);
      showToast('Added to waitlist.');
      load(true);
    } catch (err) {
      showToast(err.message, false);
    }
    setSaving(false);
  };

  const handleFill = async (entry, opening) => {
    setBusyId(entry.id);
    try {
      await bookFromWaitlist(entry.id, {
        date,
        start: opening.start,
        doctorId: opening.doctorId,
      });
      showToast(`${entry.patientName} booked at ${opening.start}.`);
      load(true);
    } catch (err) {
      showToast(err.message, false);
    }
    setBusyId(null);
  };

  const handleRemove = async (entry) => {
    if (!window.confirm(`Remove ${entry.patientName} from the waitlist?`)) return;
    try {
      await removeFromWaitlist(entry.id);
      showToast('Removed from waitlist.');
      load(true);
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const handleOverbook = async (candidate) => {
    const entry = data?.waitlist?.find((w) => !w.doctorId || w.doctorId === candidate.doctorId);
    if (!entry) {
      showToast('No waitlist patient available for this slot.', false);
      return;
    }
    setBusyId(candidate.appointmentId);
    try {
      await bookFromWaitlist(entry.id, {
        date,
        start: candidate.start,
        doctorId: candidate.doctorId,
        allowOverbook: true,
      });
      showToast(`${entry.patientName} overbooked into the ${candidate.start} slot.`);
      load(true);
    } catch (err) {
      showToast(err.message, false);
    }
    setBusyId(null);
  };

  const totals = data?.totals;

  return (
    <DashboardLayout
      title="Slot Optimizer"
      actions={(
        <>
          <span className={`live-pill${live ? ' on' : ''}`}>
            <Radio size={13} /> {live ? 'Live' : 'Offline'}
          </span>
          <button className="btn btn-blue" onClick={() => setWaitlistModal(true)}>
            <Plus size={16} /> Add to Waitlist
          </button>
        </>
      )}
    >
      <div className="date-bar">
        <button className="btn-icon" onClick={() => setDate((d) => shiftDate(d, -1))} aria-label="Previous day">
          <ChevronLeft size={16} />
        </button>
        <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-icon" onClick={() => setDate((d) => shiftDate(d, 1))} aria-label="Next day">
          <ChevronRight size={16} />
        </button>
        <button className="btn btn-ghost" onClick={() => setDate(toDateStr(new Date()))}>Today</button>
      </div>

      {loading || !data ? (
        <div className="panel"><div className="empty-state"><p>Loading…</p></div></div>
      ) : (
        <>
          <div className="util-grid">
            <div className="util-card">
              <span className="util-label">Booked capacity</span>
              <span className="util-value">{totals.bookedPct}%</span>
              <div className="util-bar"><span style={{ width: `${Math.min(totals.bookedPct, 100)}%` }} /></div>
            </div>
            <div className="util-card">
              <span className="util-label">Expected attended</span>
              <span className="util-value">{totals.expectedAttendedPct}%</span>
              <div className="util-bar expected">
                <span style={{ width: `${Math.min(totals.expectedAttendedPct, 100)}%` }} />
              </div>
            </div>
            <div className="util-card">
              <span className="util-label">Projected idle time</span>
              <span className="util-value">{totals.projectedLossMinutes} min</span>
              <span className="util-note">Expected loss from no-shows</span>
            </div>
            <div className="util-card">
              <span className="util-label">Waiting patients</span>
              <span className="util-value">{data.waitlist.length}</span>
              <span className="util-note">{data.suggestions.length} can be placed today</span>
            </div>
          </div>

          <div className="opt-columns">
            <div className="panel opt-panel">
              <div className="opt-head">
                <h2><Zap size={16} /> Suggested placements</h2>
              </div>
              {data.suggestions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Clock size={24} /></div>
                  <h3>No placements to suggest</h3>
                  <p>Either the waitlist is empty or no open gap fits the waiting patients today.</p>
                </div>
              ) : (
                <ul className="suggestion-list">
                  {data.suggestions.map(({ opening, entry }) => (
                    <li key={`${entry.id}-${opening.doctorId}-${opening.start}`}>
                      <div className="sg-slot">
                        <span className="sg-time">{opening.start}</span>
                        <span className="sg-doctor">{opening.doctorName}</span>
                      </div>
                      <div className="sg-entry">
                        <span className="sg-patient">
                          {entry.patientName}
                          <span className={`urgency urgency-${entry.urgency}`}>{entry.urgency}</span>
                        </span>
                        <span className="sg-reason">
                          {entry.reason || 'No reason given'} · {entry.durationMin} min
                        </span>
                      </div>
                      <button
                        className="btn btn-blue btn-sm"
                        disabled={busyId === entry.id}
                        onClick={() => handleFill(entry, opening)}
                      >
                        {busyId === entry.id ? 'Booking…' : 'Fill slot'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel opt-panel">
              <div className="opt-head">
                <h2><ShieldAlert size={16} /> Overbooking candidates</h2>
              </div>
              {data.overbooking.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ShieldAlert size={24} /></div>
                  <h3>Nothing to overbook</h3>
                  <p>No appointment today carries enough no-show risk to justify double-booking.</p>
                </div>
              ) : (
                <ul className="overbook-list">
                  {data.overbooking.map((c) => (
                    <li key={c.appointmentId} className={c.recommended ? 'recommended' : ''}>
                      <div className="ob-head">
                        <span className="ob-time">{c.start}</span>
                        <span className="ob-risk">{c.riskScore}% no-show risk</span>
                      </div>
                      <div className="ob-patient">{c.patientName} · {c.doctorName}</div>
                      <p className="ob-rationale">{c.rationale}</p>
                      <div className="ob-actions">
                        <span className={`ob-verdict${c.recommended ? ' good' : ''}`}>
                          {c.recommended ? 'Recommended' : 'Marginal — use judgement'}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={busyId === c.appointmentId || data.waitlist.length === 0}
                          onClick={() => handleOverbook(c)}
                        >
                          {busyId === c.appointmentId ? 'Booking…' : 'Overbook from waitlist'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="panel opt-panel">
            <div className="opt-head">
              <h2><Layers size={16} /> Open gaps by doctor</h2>
            </div>
            {data.doctors.length === 0 ? (
              <div className="empty-state"><p>No doctors configured yet.</p></div>
            ) : (
              <div className="doctor-gaps">
                {data.doctors.map((doc) => (
                  <div className="doctor-row" key={doc.doctorId}>
                    <div className="dr-info">
                      <span className="dr-name">{doc.doctorName}</span>
                      <span className="dr-meta">
                        {doc.appointments} booked · {doc.utilisation.bookedPct}% of capacity
                      </span>
                    </div>
                    <div className="dr-gaps">
                      {doc.gaps.length === 0 ? (
                        <span className="dr-full">Fully booked</span>
                      ) : (
                        doc.gaps.map((gap) => (
                          <span className="gap-chip" key={`${doc.doctorId}-${gap.start}`}>
                            {gap.start}–{gap.end}
                            <span className="gap-dur">{gap.durationMin}m</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel opt-panel">
            <div className="opt-head">
              <h2><Clock size={16} /> Waitlist</h2>
            </div>
            {data.waitlist.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Clock size={24} /></div>
                <h3>Waitlist is empty</h3>
                <p>Add patients who want an earlier slot — they will be matched to gaps automatically.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Preferred doctor</th>
                      <th>Reason</th>
                      <th>Duration</th>
                      <th>Urgency</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.waitlist.map((entry) => (
                      <tr key={entry.id}>
                        <td className="cell-strong">{entry.patientName}</td>
                        <td>{entry.doctorName || 'Any'}</td>
                        <td className="cell-dim">{entry.reason || '—'}</td>
                        <td>{entry.durationMin} min</td>
                        <td><span className={`urgency urgency-${entry.urgency}`}>{entry.urgency}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="btn-icon danger" title="Remove" onClick={() => handleRemove(entry)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {waitlistModal && (
        <Modal title="Add to Waitlist" onClose={() => setWaitlistModal(false)}>
          <form onSubmit={handleAddWaitlist}>
            <div className="fld">
              <label>Patient</label>
              <select value={form.patientId} onChange={setField('patientId')}>
                <option value="">Select a patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label>Preferred doctor</label>
              <select value={form.doctorId} onChange={setField('doctorId')}>
                <option value="">Any available doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="fld-row">
              <div className="fld">
                <label>Duration</label>
                <select value={form.durationMin} onChange={setField('durationMin')}>
                  {[15, 20, 30, 45, 60].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <label>Urgency</label>
                <select value={form.urgency} onChange={setField('urgency')}>
                  {URGENCIES.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fld">
              <label>Reason</label>
              <input type="text" value={form.reason} onChange={setField('reason')} placeholder="Follow-up consultation" />
            </div>
            <div className="modal-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setWaitlistModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? 'Adding…' : 'Add to Waitlist'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
