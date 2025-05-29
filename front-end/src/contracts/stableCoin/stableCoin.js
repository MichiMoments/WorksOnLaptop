import abi from './ABI.json';
import { ethers } from 'ethers';

class StableCoin {

    constructor() {
        this.contractAddress = "0xa50a51c09a5c451C52BB714527E1974b686D8e77";
        this.rpcEndpoint = "http://localhost:8545";
        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);
        this.contract = new ethers.Contract(this.contractAddress, abi, this.provider);
        this.signed = false;
        
        // The admin account private key should go on env, to facilitate the test of the application we are hardcoding it
        this.adminAccount = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63"
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

    async hasRole(role, account) {
        // Method to check if an account has a role
        // hasRole(bytes32 role, address account) public view returns (bool)
        const hasRole = await this.contract.hasRole(role, account);
        console.log(`Account ${account} has role ${role}: ${hasRole}`);
        return hasRole;
    }

    async mintBank (account, amount) {
        try {
            // mintBank(address account, uint256 amount)
            const addressFormatted = ethers.getAddress(account);
            const amountFormatted = ethers.parseUnits(amount.toString(), 18);
            console.log(`Minting ${amount} to ${account}`);

            this.signContract(this.adminAccount);
            const tx = await this.contract.mintBank(addressFormatted, amountFormatted);
            await tx.wait();
            console.log(`Minted ${amount} to ${account}`);
            return tx;
        } catch (error) {
            console.log(error);
        }
    }
}

export default StableCoin;