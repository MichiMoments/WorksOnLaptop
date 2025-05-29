require("@nomicfoundation/hardhat-toolbox");

// besuUrl is the url where the bootnode a is deployed
const besu = "http://localhost:8545";

// signerPK is the private key of the account that will deploy the contracts, in this case the deposit account
const signerPK = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

module.exports = {
  solidity: "0.8.27",
  networks: {
    besu: {
      url: besu,
      accounts: [signerPK],
    },
  },
};
