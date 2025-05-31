import React, { useState, useEffect } from "react";
import "./LiveData.scss";

// Utilizar este archivo si no esta cargado los nodos de chainlink en la red

function LoadingAnimation({ progress }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  let statusText = "";
  if (progress < 25) {
    statusText = "Process began";
  } else if (progress < 50) {
    statusText = "Fetching data";
  } else if (progress < 75) {
    statusText = "Almost done";
  } else {
    statusText = "Finalizing";
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

function LiveData() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState(null);

  useEffect(() => {
    let interval = null;
    const totalDuration = 10000; 
    const intervalDuration = 100; 
    const steps = totalDuration / intervalDuration;
    const increment = 100 / steps;

    interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          setLoading(false);
          fetchData();
        }
        return newProgress;
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,ethereum,stasis-eurs&vs_currencies=usd"
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching live data:", error);
    }
  };

  if (loading) {
    return <LoadingAnimation progress={progress} />;
  }

  return (
    <div className="liveData">
      <h2>Live Data Dashboard</h2>
      {data ? (
        <div className="dashboard">
          <div className="token">
            <h3>USDC (USDC)</h3>
            <p>Price: ${data["usd-coin"] ? data["usd-coin"].usd : "N/A"}</p>
          </div>
          <div className="token">
            <h3>EURC</h3>
            <p>Price: ${data["stasis-eurs"] ? data["stasis-eurs"].usd : "N/A"}</p>
          </div>
          <div className="token">
            <h3>Ethereum</h3>
            <p>Price: ${data["ethereum"] ? data["ethereum"].usd : "N/A"}</p>
          </div>
        </div>
      ) : (
        <p>Unable to load data.</p>
      )}
    </div>
  );
}

export default LiveData;
