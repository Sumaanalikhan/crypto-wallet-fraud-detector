import RiskBar from "./RiskBar";

export default function ResultCard({ result }) {
  const shortAddress =
    result.address.slice(0, 6) +
    "..." +
    result.address.slice(-4);

  return (
    <div className="result-card">
      <h2>{shortAddress}</h2>

      <div className="risk-level">
        {result.risk_level}
      </div>

      <RiskBar score={result.risk_score} />

      <div className="flags">
        <h3>Scam Indicators</h3>

        <ul>
          {result.scam_flags.map((flag, index) => (
            <li key={index}>{flag}</li>
          ))}
        </ul>
      </div>

      <div className="ai-box">
        <h3>AI Analysis</h3>
        <p>{result.ai_explanation}</p>
      </div>

      <div className="recommendation">
        Recommendation:
        <span> {result.recommendation}</span>
      </div>
    </div>
  );
}