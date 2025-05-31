// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@chainlink/contracts/src/v0.8/Chainlink.sol";

contract PriceOracle {
    function requestData() public {
    }

    // llama con los datos obtenidos
    function fulfill(bytes32 requestId, uint256 ethPrice, uint256 btcPrice, uint256 usdcPrice) external {
        Consumer(msg.sender).receivePrices(ethPrice, btcPrice, usdcPrice);
    }
}
