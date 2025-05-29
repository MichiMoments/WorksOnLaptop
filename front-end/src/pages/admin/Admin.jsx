import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import "./Admin.scss";

import TransferFunds from "../transactions/transferFunds/TransferFunds";
import ExchangeTokens from "../transactions/exchangeTokens/ExchangeTokens";
import Panel from "../panel/Panel";
import LiveData from "../transactions/liveData/LiveData";
import TransferSC from "../transactions/transferSC/TransferSC";

// 0: Admin, 1: Panel, 2: Exchange EUR to SC, 3: Transfer funds, 4: Check account balances, 5: Live Data, 6: Transfer SC
function Admin() {
  const [page, setPage] = useState(0);

  return (
    <div className="container">
      <button
        onClick={() => setPage(page === 0 ? 1 : 0)}
        className="button"
      >
        {page === 0 ? "📊 Panel of stadistics" : "🏡 Go home"}
      </button>

      {page === 0 && (
        <div className="cards">
          <Card
            title="💰 Exchange EUR to SC"
            descr="Exchange EUR to network&#39;s stablecoin SC"
            onClick={() => setPage(2)}
          />
          <Card
            title="💸 Transfer funds"
            descr="Transfer funds from an account to another using network&#39;s stablecoin"
            onClick={() => setPage(3)}
          />
          <Card
            title="📡 Live Data"
            descr="View live data updates"
            onClick={() => setPage(5)}
          />
          <Card
            title="Transfer SC"
            descr="Transfer network&#39;s stablecoin (SC) to another account"
            onClick={() => setPage(6)}
            className="last-card"
          />
        </div>
      )}

      {page === 1 && <Panel className="pageToOpen" />}
      {page === 2 && <ExchangeTokens className="pageToOpen" />}
      {page === 3 && <TransferFunds className="pageToOpen" />}
      {page === 4 && <CheckAccountBalances className="pageToOpen" />}
      {page === 5 && <LiveData className="pageToOpen" />}
      {page === 6 && <TransferSC className="pageToOpen" />}
    </div>
  );
}

export default Admin;
