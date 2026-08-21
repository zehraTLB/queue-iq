import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import Modal from '../Modal/Modal';
import './RiskDetail.scss';

const BAND_COPY = {
  low: 'Likely to attend',
  medium: 'Worth a reminder',
  high: 'Consider overbooking this slot',
};

const CONFIDENCE_COPY = {
  low: 'Limited history — score leans on the clinic baseline',
  medium: 'Based on a moderate amount of history',
  high: 'Based on a substantial visit history',
};

export default function RiskDetail({ appointment, onClose }) {
  const { risk } = appointment;

  return (
    <Modal title="No-show risk breakdown" onClose={onClose}>
      <div className="risk-detail">
        <div className={`risk-summary band-${risk.band}`}>
          <div className="risk-summary-score">{risk.score}<span>%</span></div>
          <div className="risk-summary-meta">
            <span className="risk-summary-band">{risk.band} risk</span>
            <span className="risk-summary-copy">{BAND_COPY[risk.band]}</span>
          </div>
        </div>

        <div className="risk-context">
          <strong>{appointment.patientName}</strong> with {appointment.doctorName} at {appointment.start}
        </div>

        <div className="risk-history">
          <div className="rh-item">
            <span className="rh-value">{risk.history.total}</span>
            <span className="rh-label">Past visits</span>
          </div>
          <div className="rh-item">
            <span className="rh-value">{risk.history.attended}</span>
            <span className="rh-label">Attended</span>
          </div>
          <div className="rh-item">
            <span className="rh-value">{risk.history.noShows}</span>
            <span className="rh-label">No-shows</span>
          </div>
          <div className="rh-item">
            <span className="rh-value">{risk.history.cancellations}</span>
            <span className="rh-label">Cancelled</span>
          </div>
        </div>

        <h3 className="risk-section-title">What drives this score</h3>
        {risk.factors.length === 0 ? (
          <p className="risk-empty">No individual factor moves this appointment away from the clinic baseline.</p>
        ) : (
          <ul className="risk-factors">
            {risk.factors.map((factor) => (
              <li key={factor.key}>
                <span className={`rf-icon ${factor.impact > 0 ? 'up' : 'down'}`}>
                  {factor.impact > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </span>
                <span className="rf-body">
                  <span className="rf-label">{factor.label}</span>
                  <span className="rf-detail">{factor.detail}</span>
                </span>
                <span className={`rf-impact ${factor.impact > 0 ? 'up' : 'down'}`}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact} pts
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="risk-confidence">
          <Info size={14} />
          <span>{CONFIDENCE_COPY[risk.confidence]}.</span>
        </div>
      </div>
    </Modal>
  );
}
