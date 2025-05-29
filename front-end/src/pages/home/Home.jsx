import { useState } from "react"
import BankAccounts from "../../contracts/bankAccounts/BankAccounts"
import StableCoin from "../../contracts/stableCoin/stableCoin"
import "./Home.scss"
import { agent } from '../../veramo/agent.ts'
import { toB64Url, utf8B64Url, hexToBytes } from '../../utils/jwt';
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

        // Create DID
        await createDidKey(name, publicKey)

        // Set login status to go to home
        setLoginStatus(1)

        createDidKey(name, loginKey)

        // Add to allowlists in the background
        await bankAccounts.addAllowlists(enode, address, rpcEndpoint)
    }

    // Creates the DID key and signs a JWT for the backend
    async function createDidKey(name, loginKey) {
        const identifier = await agent.didManagerCreate({
            provider: 'did:key',
            kms: 'local',
            alias: name,
            options: { keyType: 'Ed25519' },
        })
        console.log('New DID:', identifier.did)
        console.log('New DID identifier:', identifier)

        const header  = { alg: 'EdDSA', typ: 'JWT', kid: `${identifier.did}#${identifier.did.slice(8)}` };
        const now     = Math.floor(Date.now() / 1000);
        const payload = { iss: identifier.did, sub: identifier.did, aud: 'bank-backend', iat: now, exp: now + 300 };

        const h = utf8B64Url(header);
        const p = utf8B64Url(payload);
        const signingInput = `${h}.${p}`;

        const sigHex = await agent.keyManagerSign({
            keyRef  : identifier.controllerKeyId,
            data    : signingInput,
            encoding: 'utf-8',
            algorithm: 'EdDSA',                       
        });
        const jwt = `${signingInput}.${toB64Url(hexToBytes(sigHex))}`;
        console.log(JSON.stringify({ publicKey: identifier.keys[0].publicKeyHex, bankName: name, did: identifier.did, loginKey: loginKey }))
        const r = await fetch('http://localhost:3001/login', {
            method : 'POST',    
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body   : JSON.stringify({ publicKey: identifier.keys[0].publicKeyHex, bankName: name, did: identifier.did, loginKey: loginKey }),
        });

        if (!r.ok) throw new Error(await r.text());
        console.log(await r.json());

        const blob = new Blob([identifier.did], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'did.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Function that receives a txt text and console logs it
    async function checkDIDKey(txt) {
        console.log('DID Key:', txt);
        try {
            const didDoc = await agent.resolveDid({ didUrl: txt });
            console.log('Resolved DID Document:', didDoc);
            if (!didDoc.didDocument) {
                console.error('DID invalid');
                alert('DID invalid, please check the file content.');
                return;
            }
            
            const resp = await fetch(
                `http://localhost:3001/getSecret?did=${encodeURIComponent(txt)}`,
                { method: 'GET' }
            );
            if (!resp.ok) {
                if (resp.status === 404) {
                    alert('DID not found. Please register your bank first.');
                    return;
                }
                throw new Error(`Backend error ${resp.status}: ${await resp.text()}`);
            }
            const { name, login } = await resp.json();
            console.log('Name:', name);
            console.log('Type of name:', typeof name);
            console.log('Login Key:', login);
            setBankName(name);
            if (name == "Bank E") {
                setLoginKey("0xa5eaf9fcc98ac6c8a02853725305f1a17d9824598fd27f40fe55ed345e11e049")
                console.log("Bank E detected, setting login status to 2")
                setLoginStatus(2);
            } else {
                setLoginKey(login);
                const publicKey64 = bankAccounts.getNodePublicKey(login)
                // Attempt to login
                const exists = await bankAccounts.login(publicKey64, bankName)
                if (exists) {
                    console.log("Login successful")
                    setLoginStatus(2)
                    // Sign the contract with the bank account's private key
                    bankAccounts.signContract(login)
                } else {
                    console.error("Login failed")
                    alert("Login failed. Check your bank name and private key.")
                }
            }
            

        } catch (err) {
            console.error('Error:', err.message || err);
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
                        <div className="insert-did-label">
                            Insert your DID
                        </div>
                        <div>
                            <input
                                type="file"
                                accept=".txt"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const text = await file.text();
                                    checkDIDKey(text);
                                }}
                                className="file-input"
                            />
                        </div>

                        <div className="text-button last-tag" onClick={() => setLoginStatus(3)}>
                            Register
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