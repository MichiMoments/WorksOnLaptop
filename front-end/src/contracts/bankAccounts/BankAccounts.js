import abi from './ABI.json';
import { ethers } from 'ethers';
import secp256k1 from '@wangshijun/secp256k1';

//import * as secp256k1 from '@noble/secp256k1';

class BankAccounts {

    constructor() {
        this.contractAddress = "0x42699A7612A82f1d9C36148af9C77354759b210b";
        this.rpcEndpoint = "http://localhost:8545";
        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);
        this.contract = new ethers.Contract(this.contractAddress, abi, this.provider);
        this.signed = false;
        this.bootnodes = ["enode://69e84b9c135d789b637ba454fdcf7c348b3fcee0713e248c1e3edcc652088563ae5a4fd0698f7f796b875bd8008c9197022e7c15c3680e8b7cb7ec68f8b33dfa@172.20.0.3:30303","enode://18808d740470a14ca76548ca37643e69806f562b36453c4f72e36bc9f73e01bce9de5e924f4fd3a2540f748bd9afe198f9076ee9eebc200bb70e928d6cf43d20@172.20.0.4:30303"]

        // The admin account private key should go on env, to facilitate the test of the application we are hardcoding it
        this.adminAccount = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63"
    }

    getNodePublicKey(nodePrivateKey32) {
        // Method to get the public key from the private key
        // This is used to identify the bank account

        // Remove 0x prefix if present
        const privKey = nodePrivateKey32.replace('0x', '');

        const privateKeyUint8Array = new Uint8Array(
            privKey.match(/.{1,2}/g)
            .map(byte => parseInt(byte, 16))
        );
        
        const publicKeyBytes = secp256k1.publicKeyCreate(privateKeyUint8Array, false); // False to generate the 64 bytes key

        const publicKey = Array.from(publicKeyBytes)
            .slice(1) // Remove '04' prefix
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return publicKey;
    }

    signContract(accountPrivateKey32) {
        // Method to sign the contract with the bank account's private key
        // This is used to make transactions on behalf of the bank account
        if (this.signed) {
            return;
        }
        this.signer = new ethers.Wallet(accountPrivateKey32, this.provider);
        this.contract = this.contract.connect(this.signer);
        this.signed = true;
    }

    async getNode(nodePublicKey) {
        try {
            // getNode(string memory publicKey) public view returns (BankNode memory)
            const node = await this.contract.getNode(nodePublicKey);
            console.log("Getting node:");
            console.log(node);
            return node;
        } catch (error) {
            console.log(error);
        }
    }

    async getAllNodes () {
        try {
            // getAllBankNodes() public view returns (BankNode[] memory)
            const nodes = await this.contract.getAllBankNodes();
            console.log("Getting all nodes:");
            console.log(nodes);
            return nodes;
        } catch (error) {
            console.log(error);
        }
    }

    async addNodesAllowlist(enodes, rpcEndpointTarget) {
        try {
            console.log("Adding nodes to allowlist:"); 
            console.log(enodes);
            const response = await fetch(rpcEndpointTarget, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'perm_addNodesToAllowlist',
                    params: [enodes], // Pass array of enodes as parameter
                    id: 1
                })
            });
            const data = await response.json();
            console.log("Adding enodes to allowlist:");
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    }

    async addAccountsToAllowlist(addresses, rpcEndpointTarget) {
        try {
            console.log("Adding accounts to allowlist:");
            console.log(addresses);
            const response = await fetch(rpcEndpointTarget, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'perm_addAccountsToAllowlist',
                    params: [addresses], // Pass array with only the address as parameter
                    id: 1
                })
            });
            const data = await response.json();
            console.log("Adding account to allowlist:");
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    }

    async addAllowlists(enode, address, rpcEndpoint) {
        try {
            // RPC call to all enodes to add the new enode and address to their allowlist

            // 1. Get all enodes, RPC endpoints and addresses

            const nodes = await this.getAllNodes();
            
            const enodes = nodes.map(node => node.enode);
            const addresses = nodes.map(node => node.account);
            const rpcEndpoints = nodes.map(node => node.rpcEndpoint);

            // Remove duplicates in accounts, rpcEndpoints, and enodes
            const uniqueEnodes = [...new Set(enodes)];
            const uniqueAddresses = [...new Set(addresses)];
            const uniqueRpcEndpoints = [...new Set(rpcEndpoints)];

            // Remove bootnodes if present from enodes
            for (const bootnode of this.bootnodes) {
                const index = uniqueEnodes.indexOf(bootnode);
                if (index > -1) {
                    uniqueEnodes.splice(index, 1);
                }
            }

            // Remove the address of the new node
            const index = addresses.indexOf(address);
            if (index > -1) {
                uniqueAddresses.splice(index, 1);
            }

            // Remove the rpcEndpoint of the new node
            const indexRpc = rpcEndpoints.indexOf(rpcEndpoint);
            if (indexRpc > -1) {
                uniqueRpcEndpoints.splice(indexRpc, 1);
            }

            console.log("Enodes:");
            console.log(uniqueEnodes);
            console.log("Addresses:");
            console.log(uniqueAddresses);
            console.log("RPC Endpoints:");
            console.log(uniqueRpcEndpoints);

            // 2. Add the enodes of the already existing nodes to the allowlist of this new node
            await this.addNodesAllowlist(uniqueEnodes, rpcEndpoint);

            // 3. Add the accounts of the already existing nodes to the allowlist of this new node
            await this.addAccountsToAllowlist(uniqueAddresses, rpcEndpoint);

            // 4. RPC petition to add the new enode and address to the allowlist of the already existing nodes
            for (const rpc of uniqueRpcEndpoints) {
                await this.addNodesAllowlist([enode], rpc);
                await this.addAccountsToAllowlist([address], rpc);
            }

        } catch (error) {
            console.log(error);
        }
    }
    
    async nodeExists(publicKey) {
        // Method to check if a bank account already exists
        // nodeExists(string memory publicKey) public view returns (bool)
        const exists = await this.contract.nodeExists(publicKey);
        return exists;
    }

    async accountExists(account) {
        // Method to check if a bank account already exists
        // accountExists(string memory accountPrivateKey) public view returns (bool)

        const addressFormatted = ethers.getAddress(account);
        const exists = await this.contract.accountExists(addressFormatted);
        return exists
    }

    async register(publicKey, enode, name, account, rpcEndpoint) {
        // addNode(string memory name, string memory publicKey, string memory enode, address account, string memory rpcEndpoint) 

        // Sign the contract with the bank account's private key
        
        // Remove the 0x prefix if present
        publicKey = publicKey.replace('0x', '');
        console.log("Registering bank node, signing contract");
        this.signContract(this.adminAccount);
        console.log("Contract signed");

        const addressFormatted = ethers.getAddress(account);

        const tx = await this.contract.addNode(name, publicKey, enode, addressFormatted, rpcEndpoint);

        return tx;
    }

    async login(publicKey64, bankName) {
        // Method to login to an existing bank account
        // nodeExistsByName(string memory publicKey, string memory name)

        try {
            // Remove the 0x prefix if present
            publicKey64 = publicKey64.replace('0x', '');
            this.getAllNodes();
            console.log(`Logging in to bank account: ${publicKey64}, ${bankName}`)
            const exists = await this.contract.nodeExistsByName(publicKey64, bankName);
            //const exists = await this.contract.nodeExists(publicKey64);
            console.log(`Bank node exists: ${exists}`)
            return exists;
        } catch (error) {
            console.error(`Failed to login to bank account: ${publicKey64}, ${bankName}`, error);
            return false;
        }
    }

    async addAccount(publicKey64, address, gasMultiplier) {
        // Method to add an account to the bank node
        // addAccount(string memory publicKey, address account)

        // No need to sign as the contract is already signed on register call or login

        try {
            const addressFormatted = ethers.getAddress(address);
            
            // Get current gas price and increase it by 20%
            const feeData = await this.provider.getFeeData();
            const originalGasPrice = BigInt(feeData.gasPrice.toString());
            const gasToAdd = 20 * gasMultiplier;
            const gasPriceIncreased = (originalGasPrice * BigInt(100 + gasToAdd)) / BigInt(100);

            if (gasMultiplier > 0) {
                console.log(`Adding account: ${address} | Original gas price: ${originalGasPrice} | Trying with gas price: ${gasPriceIncreased}`);
            }

            // Estimate gas for the transaction
            const gasEstimate = await this.contract.addAccount.estimateGas(
                publicKey64, 
                addressFormatted
            );

            // Send transaction with explicit gas configuration
            var tx;

            if (gasMultiplier === 0) {
                tx = await this.contract.addAccount(publicKey64, addressFormatted);
            } else {
                tx = await this.contract.addAccount(
                    publicKey64, 
                    addressFormatted,
                    {
                        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
                        gasPrice: gasPriceIncreased
                    }
                );
            }
            
            // Wait for transaction confirmation
            await tx.wait();
            console.log(`Account added: ${address}`);
            return tx;
        } catch (error) {
            // If error is not related to gas then stop trying
            const gasErrorMessage = "replacement fee too low";
            if (!error.message.includes(gasErrorMessage)) {
                console.error(`Failed to add account: ${address}`, error);
                return;
            }

            console.log(`Trying again adding account ${address} with a higher gas multiplier (${20 * (gasMultiplier + 4)}%)`);

            // If gas multipier is too high then stop trying
            if (gasMultiplier > 100) {
                console.error(`No more retries for account: ${address} as gas multiplier is too high (${20 * gasMultiplier}%)`);
                console.error(`Failed to add account: ${address}`, error);
                return;
            }

            // Try again with a higher gas multiplier
            return this.addAccount(publicKey64, address, gasMultiplier + 4);
        }
    }
}

export default BankAccounts;