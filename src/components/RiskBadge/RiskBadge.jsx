import './RiskBadge.scss';

export default function RiskBadge({ risk, onClick }) {
  if (!risk) return <span className="risk-badge risk-unknown">—</span>;

  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      className={`risk-badge risk-${risk.band}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      title={onClick ? 'View risk breakdown' : undefined}
    >
      <span className="risk-dial" style={{ '--pct': risk.score }} />
      <span className="risk-score">{risk.score}%</span>
    </Tag>
  );
}
