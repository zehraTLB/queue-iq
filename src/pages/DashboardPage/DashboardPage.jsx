import { CalendarCheck2, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardPage.scss';

export default function DashboardPage() {
  const { user, profile, logout } = useAuth();
  const displayName = profile?.displayName || user?.displayName || user?.email;

  return (
    <div className="dashboard">
      <header className="dash-topbar">
        <div className="brand">
          <div className="brand-icon">
            <CalendarCheck2 size={20} strokeWidth={2.2} />
          </div>
          <span className="brand-name">Queue<span>IQ</span></span>
        </div>

        <div className="topbar-right">
          <div className="user-chip">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-meta">
              <span className="user-name">{displayName}</span>
              {profile?.role && <span className="user-role">{profile.role}</span>}
            </div>
          </div>
          <button className="btn-signout" onClick={logout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-body">
        <div className="welcome-card">
          <h1>Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}</h1>
          <p>You are signed in. The appointments, queue, and risk-scoring dashboard is coming next.</p>
        </div>
      </main>
    </div>
  );
}
