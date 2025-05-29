// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// It needs openzeppelin 4.9.6 in order to work 
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract StableCoin is ERC20PresetMinterPauser{

    address private adminAccount;

    constructor(address _adminAccount) ERC20PresetMinterPauser("StableCoin", "SC"){
        // Admin account plays the role of contract deployer and other important tasks that might be needed in the future development of the blockchain
        require(_adminAccount != address(0), "Invalid account");
        adminAccount = _adminAccount;
        _setupRole(MINTER_ROLE, adminAccount);
        _setupRole(PAUSER_ROLE, adminAccount);
    }

    function mintBank(address account, uint256 amount) external {
        // This simulates the entrance of the bank, banks declare their EUR reserves as EUR is the intermediary currency.
        // Each bank intially has their initial reserves as their balance, this will increase whenever they declare more reserves
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(amount > 0, "Amount has to be greater than 0");
        _mint(account, amount);
    }

    function burnBank(address account, uint256 amount) external {
        // This simulates the exit of the bank
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _burn(account, amount);
    }
}