import { useState } from "react";
import { validateEthAddress } from "../utils/validate";

export default function WalletForm({
  onAnalyze,
  loading
}) {
  const [address, setAddress] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateEthAddress(address)) {
      setError("Enter a valid Ethereum wallet address");
      return;
    }

    setError("");
    onAnalyze(address, demoMode);
  };

  return (
    <form onSubmit={handleSubmit} className="wallet-form">
      <input
        type="text"
        placeholder="Enter Ethereum wallet address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="demo-toggle">
        <label>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={() =>
              setDemoMode(!demoMode)
            }
          />
          Demo Mode
        </label>
      </div>

      {error && (
        <p className="error-text">{error}</p>
      )}

      <button disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Wallet"}
      </button>
    </form>
  );
}