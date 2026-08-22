import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  LogOut,
  CalendarCheck2,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.scss';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/optimizer', icon: Zap, label: 'Slot Optimizer' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
];

export default function DashboardLayout({ title, actions, children }) {
  const { user, profile, logout } = useAuth();
  const displayName = profile?.displayName || user?.displayName || user?.email;

  return (
    <div className="dash-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <CalendarCheck2 size={20} strokeWidth={2.2} />
          </div>
          <span className="sidebar-brand-name">Queue<span>IQ</span></span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="side-user">
            <div className="side-user-avatar">
              <User size={16} />
            </div>
            <div className="side-user-meta">
              <span className="side-user-name">{displayName}</span>
              {profile?.role && <span className="side-user-role">{profile.role}</span>}
            </div>
          </div>
          <button className="side-signout" type="button" onClick={logout} aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="page-head">
          <h1>{title}</h1>
          <div className="page-actions">{actions}</div>
        </header>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
