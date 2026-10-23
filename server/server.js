import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const validateAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

const getRiskLevel = (score) => {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

// ==================== TEST KEYS ENDPOINT (for debugging) ====================
app.get("/api/test-keys", async (req, res) => {
  try {
    const testAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    // Test Etherscan
    const etherscanRes = await axios.get("https://api.etherscan.io/v2/api", {
      params: {
        chainid: 1,
        module: "account",
        action: "balance",
        address: testAddress,
        apikey: process.env.ETHERSCAN_API_KEY
      },
      timeout: 10000
    });

    // Test Groq
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: "Reply only with: Groq is working" }],
        max_tokens: 10
      },
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 10000
      }
    );

    res.json({
      status: "✅ Both APIs are responding",
      etherscan: etherscanRes.data.status === "1" ? "✅ Working" : "❌ Failed",
      groq: "✅ Working",
      etherscan_message: etherscanRes.data.message
    });
  } catch (err) {
    res.status(500).json({
      status: "❌ One or both APIs failed",
      error: err.response?.data || err.message
    });
  }
});

// ==================== MAIN ANALYZE ENDPOINT ====================
app.post("/api/analyze", async (req, res) => {
  try {
    const { address, demoMode } = req.body;

    if (!address || !validateAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum wallet address" });
    }

    if (demoMode === true) {
      return res.json({
        address,
        risk_score: 85,
        risk_level: "CRITICAL",
        scam_flags: ["Suspicious activity detected"],
        ai_explanation: "Demo mode active - high risk simulation.",
        recommendation: "AVOID",
        balance: "0.00",
        tx_count: 42
      });
    }

    const BASE_URL = "https://api.etherscan.io/v2/api";
    const CHAIN_ID = 1;

    // === Etherscan Balance ===
    let balanceETH = 0;
    try {
      const balanceRes = await axios.get(BASE_URL, {
        params: { chainid: CHAIN_ID, module: "account", action: "balance", address, tag: "latest", apikey: process.env.ETHERSCAN_API_KEY },
        timeout: 12000
      });

      if (balanceRes.data.status !== "1") {
        throw new Error(`Etherscan Error: ${balanceRes.data.message || 'Unknown'}`);
      }
      balanceETH = parseFloat(balanceRes.data.result) / 1e18;
    } catch (e) {
      console.error("Etherscan Balance Error:", e.message);
      throw new Error("Etherscan Balance failed: " + e.message);
    }

    // === Etherscan Transactions ===
    let transactions = [];
    try {
      const txRes = await axios.get(BASE_URL, {
        params: { 
          chainid: CHAIN_ID, 
          module: "account", 
          action: "txlist", 
          address, 
          page: 1, 
          offset: 25, 
          sort: "desc", 
          apikey: process.env.ETHERSCAN_API_KEY 
        },
        timeout: 15000
      });

      if (txRes.data.status === "1") {
        transactions = txRes.data.result || [];
      }
    } catch (e) {
      console.error("Etherscan Tx Error:", e.message);
      // Don't throw here - continue with what we have
    }

    // ==================== RISK CALCULATION ====================
    let riskScore = 15;
    let scamFlags = [];

    if (transactions.length >= 80) { riskScore += 30; scamFlags.push("High transaction volume"); }
    if (balanceETH < 0.01) { riskScore += 20; scamFlags.push("Very low balance"); }
    if (transactions.length === 0) { riskScore += 15; scamFlags.push("No activity"); }

    const uniqueWallets = new Set(transactions.flatMap(tx => [tx.from, tx.to]).filter(Boolean));
    if (uniqueWallets.size > 20) { riskScore += 25; scamFlags.push("Many wallet interactions"); }

    if (riskScore > 100) riskScore = 100;
    const riskLevel = getRiskLevel(riskScore);

    // ==================== GROQ AI ====================
    let aiExplanation = "Analysis completed.";
    try {
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: "You are a professional blockchain fraud detection expert." },
            { role: "user", content: `Analyze this wallet:\nAddress: ${address}\nBalance: ${balanceETH.toFixed(4)} ETH\nTx Count: ${transactions.length}\nFlags: ${scamFlags.join(", ") || "None"}` }
          ],
          temperature: 0.3,
          max_tokens: 600
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 15000
        }
      );

      aiExplanation = groqRes.data.choices?.[0]?.message?.content || aiExplanation;
    } catch (groqErr) {
      console.error("Groq Error:", groqErr.message);
      aiExplanation = "AI analysis unavailable at the moment.";
    }

    const recommendation = riskScore >= 75 ? "AVOID" : (riskScore >= 45 ? "CAUTION" : "SAFE");

    res.json({
      address,
      risk_score: Math.round(riskScore),
      risk_level: riskLevel,
      scam_flags: scamFlags,
      ai_explanation: aiExplanation,
      recommendation,
      balance: balanceETH.toFixed(4),
      tx_count: transactions.length
    });

  } catch (error) {
    console.error("Full Error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to analyze wallet",
      reason: error.message || "Unknown error",
      suggestion: "Try using demoMode: true or check your API keys"
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔍 Test keys: http://localhost:${PORT}/api/test-keys`);
});