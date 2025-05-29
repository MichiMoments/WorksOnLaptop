import React, { useState } from "react"
import BankAccounts from "../../contracts/bankAccounts/BankAccounts"
import StableCoin from "../../contracts/stableCoin/stableCoin"
import "./Home.scss"

import Admin from "../admin/Admin"

function BankAdmin() {

    const bankAccounts = new BankAccounts()
    const stableCoin = new StableCoin()

    // 1: Not logged in, 2: Logged in, 3: Registering
    const [loginStatus, setLoginStatus] = useState(1)

    // Register form fields
    const [publicKey, setPublicKey] = useState("")
    const [enode, setEnode] = useState("")
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [totalReserves, setTotalReserves] = useState("")
    const [rpcEndpoint, setRpcEndpoint] = useState("")

    // Login form fields
    const [loginKey, setLoginKey] = useState("") // Private key for login
    const [bankName, setBankName] = useState("") // Bank name

    // Register function
    const register = async () => {
        // Check for empty fields
        if (publicKey === "" || enode === "" || name === "" || address === "" || totalReserves === "" || rpcEndpoint === "") {
            console.error("Empty fields")
            alert("Please fill all fields")
            return
        }
        // First, check existance
        const exists = await bankAccounts.nodeExists(publicKey)
        if (exists) {
            console.error("Bank account already exists")
            alert("Bank node already exists. Try again with a different node public key or login.")
            return
        }

        // Second, check that account existance
        const accountExists = await bankAccounts.accountExists(address)
        if (accountExists) {
            console.error("Bank account already exists on other bank")
            alert("Bank account already exists on another bank. Try again with a different account address.")
            return
        }

        // Register bank account
        const tx = await bankAccounts.register(publicKey, enode, name, address, rpcEndpoint)
        await tx.wait()
        console.log(`Transaction successful: ${tx.hash}`)

        // Mint reserves to the bank account
        const mintTx = await stableCoin.mintBank(address, totalReserves)
        await mintTx.wait()
        console.log(`Mint transaction successful: ${mintTx.hash}`)

        // Set login status to logged in
        setLoginStatus(2)

        // Add to allowlists in the background
        await bankAccounts.addAllowlists(enode, address, rpcEndpoint)
    }

    // Login function
    const login = async () => {
        // Get the node public key from the private key
        const publicKey64 = bankAccounts.getNodePublicKey(loginKey)
        // Add 0x to the beginning
        
        console.log(`Public key: ${publicKey64}`)

        // Attempt to login
        const exists = await bankAccounts.login(publicKey64, bankName)
        if (exists) {
            console.log("Login successful")
            setLoginStatus(2)
            // Sign the contract with the bank account's private key
            bankAccounts.signContract(loginKey)
        } else {
            console.error("Login failed")
            alert("Login failed. Check your bank name and private key.")
        }
    }

    const testingValues = () => {
        setPublicKey("63564513fcd3f11c1de798e601c440204b4ca008c32d9398425fd9a3a4c3f864832ca58317eb4581fed95ad79d0ada2a65385a35f350b6a3e5f85cbc1c7ab799")
        setEnode("enode://63564513fcd3f11c1de798e601c440204b4ca008c32d9398425fd9a3a4c3f864832ca58317eb4581fed95ad79d0ada2a65385a35f350b6a3e5f85cbc1c7ab799@172.20.0.7:30303")
        setName("Bank E")
        // setAddress("0xa17150d5aefedc8446f433e9877d881fe2d86413")

        // Test metamask acc
        // Pub: 0x216542EA28B7d2E7D941d33b370993bB19Fd95f7
        // Priv: 9f462e542d5b1bf729bea8f437e48a7fb0bec382bd5f215f130fd1b58c129e69
        setAddress("0x216542EA28B7d2E7D941d33b370993bB19Fd95f7")       

        setTotalReserves("1000000")
        setRpcEndpoint("http://172.20.0.7:8545")

        // E
        setBankName("Bank E")
        setLoginKey("0xa5eaf9fcc98ac6c8a02853725305f1a17d9824598fd27f40fe55ed345e11e049")


        // A
        // setBankName("Hello Bank")
        // setLoginKey("0xaeba9c972504a76e1953667411f54c801da24a0896a7e305aebee241b1b45243")
    }

    return (
        <div className="admin">

            <div className="header">
                <h1>Private besu network for cross-border payment</h1>
            </div>

            <div className="body">

                {loginStatus === 1 && (
                    <div className="login">
                        <div className="login-name">Enter your bank name</div>
                        <br />
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="text-input-short"
                        />
                        <br />

                        <div className="login-key">Enter your bank node private key (32 bytes)</div>
                        <br />
                        <input
                            type="text"
                            value={loginKey}
                            onChange={(e) => setLoginKey(e.target.value)}
                            className="text-input-short"
                        />
                        <br />

                        <button onClick={() => login()} className="button">
                            Login
                        </button>
                        <br />

                        <div className="text-button last-tag" onClick={() => setLoginStatus(3)}>
                            Register
                        </div>

                        <div className="text-button" onClick={() => testingValues()}>
                            Use testing values
                        </div>
                    </div>
                )}
                {loginStatus === 2 && (
                    <div className="logged-in">
                        <Admin />
                    </div>
                )}
                {loginStatus === 3 && (

                    <div className="register">

                        <div className="enter-key">Enter your bank node public key (64 bytes)</div>
                        <br />
                        <input
                            type="text"
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            className="text-input-short"
                        />
                        <br />
                        <div className="bank-name">Enter your bank name</div>
                        <br />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-input-short"
                        />

                        <br />
                        <div className="bank-enode">Enter your bank enode URL</div>
                        <br />
                        <input
                            type="text"
                            value={enode}
                            onChange={(e) => setEnode(e.target.value)}
                            className="text-input-short"
                        />

                        <br />
                        <div className="bank-addresses">Enter your bank account public address</div>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="text-input-short"
                        />

                        <br />
                        <div className="bank-addresses">Enter your bank total reserves in EUR FIAT</div>
                        <input
                            type="text"
                            value={totalReserves}
                            onChange={(e) => setTotalReserves(e.target.value)}
                            className="text-input-short"
                        />

                        <br />
                        <div className="bank-addresses">Enter your bank node RPC endpoint</div>
                        <input
                            type="text"
                            value={rpcEndpoint}
                            onChange={(e) => setRpcEndpoint(e.target.value)}
                            className="text-input-short"
                        />

                        <br />
                        <button onClick={() => register()} className="button register-button">
                            Register
                        </button>
                        <br />

                        <div className="text-button" onClick={() => testingValues()}>
                            Use testing values
                        </div>

                        <div className="text-button last-tag" onClick={() => setLoginStatus(1)}>
                            Back
                        </div>
                    </div>

                )}
            </div>

        </div>
    );

}

export default BankAdmin