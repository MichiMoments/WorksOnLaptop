import React, { useState } from "react";
import "./TransferSC.scss";

function LoadingAnimation({ progress }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  let statusText = "";
  if (progress < 25) {
    statusText = "Process began";
  } else if (progress < 50) {
    statusText = "Transferring funds";
  } else if (progress < 75) {
    statusText = "Almost done";
  } else {
    statusText = "Finalizing transfer";
  }

  return (
    <div className="loading-container">
      <svg className="progress-ring" width="120" height="120">
        <circle
          className="progress-ring__circle"
          stroke="blue"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.1s linear"
          }}
        />
      </svg>
      <div className="loading-text">{statusText}</div>
    </div>
  );
}

function TransferSC() {
  const [fromCurrency, setFromCurrency] = useState("SC");
  const [toCurrency, setToCurrency] = useState("SC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const handleTransfer = () => {
    if (!loading) {
      setLoading(true);
      setProgress(0);
      const totalDuration = 10000; // 10 seconds total
      const intervalDuration = 100; // update every 100ms
      const steps = totalDuration / intervalDuration;
      const increment = 100 / steps;

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + increment;
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLoading(false);
              setShowPopup(true);
            }, 100);
            return 100;
          }
          return newProgress;
        });
      }, intervalDuration);
    }
  };

  return (
    <div className="transferSC">
      <div className="transferSC-container">
        <h2>Transfer SC</h2>
        <div className="exchange-panel">
          <div className="form-group">
            <label>From:</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              <option value="CCIP-BnM">CCIP-BnM</option>
              <option value="CCIP-LnM">CCIP-LnM</option>
              {/*  */}
            </select>
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To:</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              <option value="CCIP-BnMC">CCIP-BnM</option>
              <option value="CCIP-LnM">CCIP-LnM</option>
              {/*  */}
            </select>
          </div>
          <button onClick={handleTransfer}>Transfer SC</button>
        </div>
      </div>

      {loading && <LoadingAnimation progress={progress} />}

      {showPopup && (
        <div
          className="modal-overlay"
          onClick={() => setShowPopup(false)}
          tabIndex={-1}
          style={{ cursor: "pointer" }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <button
              className="modal-close"
              onClick={() => setShowPopup(false)}
              aria-label="Close"
            >
            </button>
            <h2>Transfer Successful</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferSC;
