const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ADMIN_ACCOUNT = "fe3b557e8fb62b89f4916b721be55ceb828dbd73"

module.exports = buildModule("DeployModule", (m) => {
  const bankAccounts = m.contract("BankAccounts");

  const adminAccount = m.getParameter("adminAccount", ADMIN_ACCOUNT).defaultValue;
  console.log("Admin Account:", adminAccount);

  const stableCoin = m.contract("StableCoin", [adminAccount]);

  return { bankAccounts, stableCoin };
});