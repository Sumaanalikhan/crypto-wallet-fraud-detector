export default function RiskBar({ score }) {
  return (
    <div className="risk-wrapper">
      <div className="risk-track">
        <div
          className="risk-fill"
          style={{ width: `${score}%` }}
        />
      </div>

      <p>{score}/100</p>
    </div>
  );
}  