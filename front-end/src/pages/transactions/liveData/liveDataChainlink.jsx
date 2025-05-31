// src/components/LiveData.jsx

import React, { useState, useEffect } from "react";
import { WebSocketProvider, Contract, utils } from "ethers";
import "./LiveData.scss";

const consumerAbi = [
  "event PriceUpdated(string asset, uint256 price, uint256 timestamp)",
  "function priceETH() view returns (uint256)",
  "function priceBTC() view returns (uint256)",
  "function priceUSD() view returns (uint256)",
  "function lastTimestamp() view returns (uint256)"
];

const consumerAddress = "0x..."; // Reemplazar con la dirección del contrato, esto es diferente en cada red, no puedo poner mi direccion aqui
// por seguridad


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

  const [ethPrice, setEthPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [usdcPrice, setUsdcPrice] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  useEffect(() => {
    let interval = null;
    const totalDuration = 10000; 
    const intervalDuration = 300000; 
    const steps = totalDuration / intervalDuration;
    const increment = 100 / steps;

    interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          setLoading(false);
        }
        return newProgress;
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (loading) return;

    const wsProvider = new WebSocketProvider("ws://localhost:8546"); 

    const consumerContract = new Contract(
      consumerAddress,
      consumerAbi,
      wsProvider
    );

    const fetchInitialPrices = async () => {
      try {
        const [
          ethOnchain,
          btcOnchain,
          usdcOnchain,
          timestampOnchain
        ] = await Promise.all([
          consumerContract.priceETH(),
          consumerContract.priceBTC(),
          consumerContract.priceUSD(),
          consumerContract.lastTimestamp()
        ]);

        setEthPrice(utils.formatUnits(ethOnchain, 18));
        setBtcPrice(utils.formatUnits(btcOnchain, 18));
        setUsdcPrice(utils.formatUnits(usdcOnchain, 18));

        const tsNumber = timestampOnchain.toNumber();
        setLastUpdate(new Date(tsNumber * 1000).toLocaleString());
      } catch (err) {
        console.error("Error leyendo precios on-chain:", err);
      }
    };

    fetchInitialPrices();

    const onPriceUpdated = (asset, priceBN, timestampBN) => {
      const priceDecimal = utils.formatUnits(priceBN, 18);
      const ts = timestampBN.toNumber(); 

      if (asset === "ETH") {
        setEthPrice(priceDecimal);
      } else if (asset === "BTC") {
        setBtcPrice(priceDecimal);
      } else if (asset === "USDC") {
        setUsdcPrice(priceDecimal);
      }
      setLastUpdate(new Date(ts * 1000).toLocaleString());
    };

    consumerContract.on("PriceUpdated", onPriceUpdated);

    return () => {
      consumerContract.off("PriceUpdated", onPriceUpdated);
      wsProvider.destroy();
    };
  }, [loading]);

  if (loading) {
    return <LoadingAnimation progress={progress} />;
  }

  return (
    <div className="liveData">
      <h2>Live Data Dashboard (On-Chain)</h2>
      <div className="dashboard">
        <div className="token">
          <h3>USDC (USDC)</h3>
          <p>Price: {usdcPrice !== null ? `$${usdcPrice}` : "N/A"}</p>
        </div>
        <div className="token">
          <h3>Ethereum (ETH)</h3>
          <p>Price: {ethPrice !== null ? `$${ethPrice}` : "N/A"}</p>
        </div>
        <div className="token">
          <h3>Bitcoin (BTC)</h3>
          <p>Price: {btcPrice !== null ? `$${btcPrice}` : "N/A"}</p>
        </div>
      </div>
      <div className="timestamp">
        <p>
          Última actualización:{" "}
          {lastUpdate !== null ? lastUpdate : "Esperando datos..."}
        </p>
      </div>
    </div>
  );
}

export default LiveData;
