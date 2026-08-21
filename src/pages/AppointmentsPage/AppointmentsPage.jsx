import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserCheck,
  CheckCircle2,
  UserX,
  Ban,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import RiskBadge from '../../components/RiskBadge/RiskBadge';
import RiskDetail from '../../components/RiskDetail/RiskDetail';
import { useToast } from '../../components/Toast/ToastProvider';
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  listPatients,
  listDoctors,
} from '../../api/resources';
import './AppointmentsPage.scss';

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

const endTime = (start, durationMin) => {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + durationMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const DURATIONS = [15, 20, 30, 45, 60, 90];

const EMPTY_FORM = { patientId: '', doctorId: '', start: '09:00', durationMin: 30, reason: '' };

export default function AppointmentsPage() {
  const showToast = useToast();
  const [date, setDate] = useState(toDateStr(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [riskDetail, setRiskDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await listAppointments(date));
    } catch (err) {
      showToast(err.message, false);
    }
    setLoading(false);
  }, [date, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([listPatients(), listDoctors()])
      .then(([p, d]) => {
        setPatients(p);
        setDoctors(d);
      })
      .catch((err) => showToast(err.message, false));
  }, [showToast]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId) {
      showToast('Please select a patient and a doctor.', false);
      return;
    }
    setSaving(true);
    try {
      await createAppointment({ ...form, date, durationMin: Number(form.durationMin) });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      showToast('Appointment booked.');
      load();
    } catch (err) {
      showToast(err.message, false);
    }
    setSaving(false);
  };

  const setStatus = async (appt, status) => {
    try {
      await updateAppointment(appt.id, { status });
      setAppointments((list) => list.map((a) => (a.id === appt.id ? { ...a, status } : a)));
      showToast(`Marked as ${status.replace('-', ' ')}.`);
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const actionsFor = (appt) => {
    if (appt.status === 'scheduled') {
      return (
        <>
          <button className="btn-icon" title="Check in" onClick={() => setStatus(appt, 'checked-in')}>
            <UserCheck size={15} />
          </button>
          <button className="btn-icon" title="Mark no-show" onClick={() => setStatus(appt, 'no-show')}>
            <UserX size={15} />
          </button>
          <button className="btn-icon danger" title="Cancel" onClick={() => setStatus(appt, 'cancelled')}>
            <Ban size={15} />
          </button>
        </>
      );
    }
    if (appt.status === 'checked-in') {
      return (
        <button className="btn-icon" title="Complete" onClick={() => setStatus(appt, 'completed')}>
          <CheckCircle2 size={15} />
        </button>
      );
    }
    return null;
  };

  return (
    <DashboardLayout
      title="Appointments"
      actions={(
        <button className="btn btn-blue" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Appointment
        </button>
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

      <div className="panel">
        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CalendarDays size={24} /></div>
            <h3>No appointments</h3>
            <p>Nothing is booked for this day yet. Use “New Appointment” to book the first slot.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Reason</th>
                  <th>No-show risk</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className={appt.risk?.band === 'high' ? 'row-high-risk' : ''}>
                    <td className="cell-time">
                      {appt.start} – {endTime(appt.start, appt.durationMin)}
                    </td>
                    <td className="cell-strong">{appt.patientName}</td>
                    <td>{appt.doctorName}</td>
                    <td className="cell-dim">{appt.reason || '—'}</td>
                    <td><RiskBadge risk={appt.risk} onClick={() => setRiskDetail(appt)} /></td>
                    <td><span className={`chip chip-${appt.status}`}>{appt.status.replace('-', ' ')}</span></td>
                    <td><div className="row-actions">{actionsFor(appt)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {riskDetail && (
        <RiskDetail appointment={riskDetail} onClose={() => setRiskDetail(null)} />
      )}

      {modalOpen && (
        <Modal title="New Appointment" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
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
              <label>Doctor</label>
              <select value={form.doctorId} onChange={setField('doctorId')}>
                <option value="">Select a doctor…</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="fld-row">
              <div className="fld">
                <label>Time</label>
                <input type="time" value={form.start} onChange={setField('start')} required />
              </div>
              <div className="fld">
                <label>Duration</label>
                <select value={form.durationMin} onChange={setField('durationMin')}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fld">
              <label>Reason for visit</label>
              <input
                type="text"
                value={form.reason}
                onChange={setField('reason')}
                placeholder="Annual check-up"
              />
            </div>
            <div className="modal-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? 'Booking…' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
