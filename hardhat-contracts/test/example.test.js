const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Interbank System", function () {
  let owner, bank1, bank2, priceOracle, registry, transactionManager, eurcToken;

  beforeEach(async function () {
    // Get signers
    [owner, bank1, bank2] = await ethers.getSigners();

    // Deploy mock EURC token
    const EURCToken = await ethers.getContractFactory("MockEURC");
    eurcToken = await EURCToken.deploy(owner.address);

    // Deploy Price Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy(owner.address);

    // Deploy Institution Registry
    const InterbankRegistry = await ethers.getContractFactory("InterbankRegistry");
    registry = await InterbankRegistry.deploy(owner.address);

    // Deploy Transaction Manager
    const TransactionManager = await ethers.getContractFactory("InterbankTransactionManager");
    transactionManager = await TransactionManager.deploy(
      eurcToken.target, 
      priceOracle.target, 
      registry.target
    );
  });

  it("Should register an institution", async function () {
    await registry.registerInstitution(bank1.address, 0); // 0 = Bank
    await registry.approveInstitution(bank1.address);
    
    const institution = await registry.institutions(bank1.address);
    expect(institution.isApproved).to.be.true;
  });

  it("Should update currency rates", async function () {
    await priceOracle.updateRate("USD", "EURC", ethers.parseUnits("1", 18));
    const rate = await priceOracle.getRate("USD", "EURC");
    expect(rate).to.equal(ethers.parseUnits("1", 18));
  });

  it("Should initiate a transaction", async function () {
    // Register and approve institutions
    await registry.registerInstitution(bank1.address, 0);
    await registry.registerInstitution(bank2.address, 0);
    await registry.approveInstitution(bank1.address);
    await registry.approveInstitution(bank2.address);

    // Update conversion rates
    await priceOracle.updateRate("USD", "EURC", ethers.parseUnits("1", 18));
    await priceOracle.updateRate("EURC", "EUR", ethers.parseUnits("1", 18));

    // Initiate transaction
    const tx = await transactionManager.connect(bank1).initiateTransaction(
      bank2.address, 
      "USD", 
      "EUR", 
      ethers.parseUnits("100", 18)
    );

    const receipt = await tx.wait();
    const transactionId = receipt.logs[0].args[0];

    // Convert to EURC
    await transactionManager.connect(bank1).convertToEURC(transactionId);

    // Transfer to target
    await transactionManager.connect(bank1).transferToTarget(transactionId);

    // Verify transaction details
    const transaction = await transactionManager.transactions(transactionId);
    expect(transaction.status).to.equal(2); // Transferred
  });
});