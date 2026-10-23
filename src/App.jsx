import { useState } from "react";
import WalletForm from "./components/WalletForm";
import ResultCard from "./components/ResultCard";
import Loader from "./components/Loader";
import { analyzeWallet } from "./services/api";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (
    address,
    demoMode
  ) => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await analyzeWallet({
        address,
        demoMode
      });

      setResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Crypto Wallet Fraud Detector</h1>

        <WalletForm
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {loading && <Loader />}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {result && (
          <ResultCard result={result} />
        )}
      </div>
    </div>
  );
}