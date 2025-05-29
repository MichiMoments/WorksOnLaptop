import React from "react"
import { useState } from "react"
import { ethers } from "ethers"
import './TransferFunds.scss'
import stableCoinAbi from "../../../abiFiles/StableCoinABI.json"

function TransferFunds(){

    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const contractAddress = "0xa50a51c09a5c451C52BB714527E1974b686D8e77";

    const [fromAccount, setFromAccount] = useState("");
    const [toAccount, setToAccount] = useState("");
    const [privateKeyFromAccount, setPrivateKeyFromAccount] = useState("")
    const [amount, setAmount] = useState("");

    const handleTransfer = async () => {
        try{
            const formatterFromAccount = ethers.getAddress(fromAccount);
            const formatterToAccount = ethers.getAddress(toAccount);
            const wallet = new ethers.Wallet(privateKeyFromAccount, provider);
        
            const approved = await approveTokens(fromAccount, amount);
            if (!approved) return;
    
            const smartContract = new ethers.Contract(contractAddress, stableCoinAbi, wallet);
    
            const tx = await smartContract.transferFrom(
                formatterFromAccount,
                formatterToAccount,
                ethers.parseUnits(amount, 18) // Ajusta a los decimales del token
            );
            console.log("Transacción enviada para transferFrom:", tx.hash);
            await tx.wait(); // Esperar confirmación
            alert("Transferencia completada con éxito!");
        } catch (error) {
            console.error("Error durante la transferencia: ", error);
            alert("Ocurrio un error. Revisa la consola.")
        }
    };

    async function approveTokens(spender, amount, gasMultiplier = 0) {
        try {
            const formattedSpender = ethers.getAddress(spender);

            const wallet = new ethers.Wallet(privateKeyFromAccount, provider);
            const smartContract = new ethers.Contract(contractAddress, stableCoinAbi, wallet);

            // Get current gas price and increase it by 20%
            const feeData = await provider.getFeeData();
            const originalGasPrice = BigInt(feeData.gasPrice.toString());
            const gasToAdd = 20 * gasMultiplier;
            const gasPriceIncreased = (originalGasPrice * BigInt(100 + gasToAdd)) / BigInt(100);

            if (gasMultiplier > 0) {
                console.log(`Adding account: ${address} | Original gas price: ${originalGasPrice} | Trying with gas price: ${gasPriceIncreased}`);
            }

            // Estimate gas for the transaction
            const gasEstimate = await smartContract.approve.estimateGas(
                formattedSpender,
                ethers.parseUnits(amount, 18)
            );

            // Send transaction with explicit gas configuration
            var tx;

            if (gasMultiplier === 0) {
                tx = await smartContract.approve(
                    formattedSpender,
                    ethers.parseUnits(amount, 18)
                );
            } else {
                tx = await smartContract.approve(
                    formattedSpender,
                    ethers.parseUnits(amount, 18),
                    {
                        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
                        gasPrice: gasPriceIncreased
                    }
                );
            }

            // Wait for transaction confirmation
            await tx.wait();
            console.log(`Tokens approved for spender: ${formattedSpender}`);
            return tx;
        } catch (error) {
            // If error is not related to gas then stop trying
            const gasErrorMessage = "replacement fee too low";
            if (!error.message.includes(gasErrorMessage)) {
                console.error(`Failed to approve tokens for spender: ${spender}`, error);
                return;
            }

            console.log(`Trying again approving tokens for spender ${spender} with a higher gas multiplier (${20 * (gasMultiplier + 4)}%)`);

            // If gas multipier is too high then stop trying
            if (gasMultiplier > 100) {
                console.error(`No more retries for spender: ${spender} as gas multiplier is too high (${20 * gasMultiplier}%)`);
                console.error(`Failed to approve tokens for spender: ${spender}`, error);
                return;
            }

            // Try again with a higher gas multiplier
            return this.approveTokens(spender, amount, gasMultiplier + 4);
        }
    }

    return(
        <div className="exchange-container">
            <h2 className="title">Transfer funds</h2>
            <div className="token-checker">
                <div className="token-checker-section">
                    <h2>Transfer SC to another account</h2>
                    <label>Account to deposit tokens</label>
                    <input
                        type="text"
                        value={toAccount}
                        onChange={(e) => setToAccount(e.target.value)}
                        placeholder="Enter recipient account"
                    />
                    <label>Account where the tokens would be debited</label>
                    <input
                        type="text"
                        value={fromAccount}
                        onChange={(e) => setFromAccount(e.target.value)}
                        placeholder="Enter sender account"
                    />
                    <label>Put the private key of the sender account</label>
                    <input
                        type="text"
                        value={privateKeyFromAccount}
                        onChange={(e) => setPrivateKeyFromAccount(e.target.value)}
                        placeholder="Enter private key of the sender account"
                    />
                    <label>Number of tokens to exchange</label>
                    <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter number of SC you want to exchange"
                    />
                    <button onClick={handleTransfer} className="token-checker-button">
                        Transfer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TransferFunds