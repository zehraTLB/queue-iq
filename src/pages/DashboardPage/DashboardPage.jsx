import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, UserCheck, ShieldAlert, UserX, ArrowRight, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import RiskBadge from '../../components/RiskBadge/RiskBadge';
import RiskDetail from '../../components/RiskDetail/RiskDetail';
import { useToast } from '../../components/Toast/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { listAppointments } from '../../api/resources';
import './DashboardPage.scss';

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const ACTIVE = ['scheduled', 'checked-in'];

export default function DashboardPage() {
  const showToast = useToast();
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskDetail, setRiskDetail] = useState(null);

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
  const atRisk = appointments
    .filter((a) => ACTIVE.includes(a.status) && a.risk?.band === 'high')
    .sort((a, b) => b.risk.score - a.risk.score);
  const firstName = (profile?.displayName || user?.displayName || '').split(' ')[0];

  const cards = [
    { label: "Today's Appointments", value: appointments.length, icon: CalendarDays, tone: 'blue' },
    { label: 'Checked In', value: count('checked-in'), icon: UserCheck, tone: 'teal' },
    { label: 'High No-Show Risk', value: atRisk.length, icon: ShieldAlert, tone: 'amber' },
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

      <div className="panel watchlist-panel">
        <div className="upcoming-head">
          <h2>No-show watchlist</h2>
          <Link to="/appointments" className="see-all">
            All appointments <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : atRisk.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ShieldCheck size={24} /></div>
            <h3>No high-risk appointments</h3>
            <p>Every active appointment today scores below the high-risk threshold.</p>
          </div>
        ) : (
          <ul className="watchlist">
            {atRisk.map((appt) => (
              <li key={appt.id}>
                <span className="wl-time">{appt.start}</span>
                <span className="wl-body">
                  <span className="wl-patient">{appt.patientName}</span>
                  <span className="wl-reason">
                    {appt.risk.factors[0] ? appt.risk.factors[0].detail : appt.doctorName}
                  </span>
                </span>
                <RiskBadge risk={appt.risk} onClick={() => setRiskDetail(appt)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {riskDetail && (
        <RiskDetail appointment={riskDetail} onClose={() => setRiskDetail(null)} />
      )}
    </DashboardLayout>
  );
}
