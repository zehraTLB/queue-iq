import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, UserCheck, CheckCircle2, UserX, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { useToast } from '../../components/Toast/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { listAppointments } from '../../api/resources';
import './DashboardPage.scss';

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function DashboardPage() {
  const showToast = useToast();
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setAppointments(await listAppointments(toDateStr(new Date())));
    } catch (err) {
      showToast(err.message, false);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const count = (status) => appointments.filter((a) => a.status === status).length;
  const upcoming = appointments.filter((a) => ['scheduled', 'checked-in'].includes(a.status)).slice(0, 6);
  const firstName = (profile?.displayName || user?.displayName || '').split(' ')[0];

  const cards = [
    { label: "Today's Appointments", value: appointments.length, icon: CalendarDays, tone: 'blue' },
    { label: 'Checked In', value: count('checked-in'), icon: UserCheck, tone: 'teal' },
    { label: 'Completed', value: count('completed'), icon: CheckCircle2, tone: 'green' },
    { label: 'No-Shows', value: count('no-show'), icon: UserX, tone: 'red' },
  ];

  return (
    <DashboardLayout title={firstName ? `Good day, ${firstName}` : 'Dashboard'}>
      <div className="stat-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className={`stat-icon tone-${card.tone}`}>
                <Icon size={19} />
              </div>
              <div className="stat-value">{loading ? '—' : card.value}</div>
              <div className="stat-caption">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="panel upcoming-panel">
        <div className="upcoming-head">
          <h2>Up next today</h2>
          <Link to="/appointments" className="see-all">
            All appointments <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CalendarDays size={24} /></div>
            <h3>Nothing in the queue</h3>
            <p>There are no active appointments left for today.</p>
          </div>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((appt) => (
              <li key={appt.id}>
                <span className="up-time">{appt.start}</span>
                <span className="up-patient">{appt.patientName}</span>
                <span className="up-doctor">{appt.doctorName}</span>
                <span className={`chip chip-${appt.status}`}>{appt.status.replace('-', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
