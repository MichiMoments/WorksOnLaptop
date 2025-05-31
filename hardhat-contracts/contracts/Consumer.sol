// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Consumer is Ownable {
    // Precios actuales
    uint256 public ethPrice;
    uint256 public btcPrice;
    uint256 public usdcPrice;
    uint256 public lastTimestamp;

    // Direcciones autorizadas
    mapping(address => bool) public authorizedOracles;

    // Evento para front-end
    event PriceUpdated(uint256 ethPrice, uint256 btcPrice, uint256 usdcPrice, uint256 timestamp);

    constructor(address[] memory oracles) {
        // Inicializar oracles autorizados
        for(uint i = 0; i < oracles.length; i++) {
            authorizedOracles[oracles[i]] = true;
        }
    }

    // Función que sólo los oráculos autorizados pueden llamar
    function updatePrices(uint256 _ethPrice, uint256 _btcPrice, uint256 _usdcPrice) external {
        require(authorizedOracles[msg.sender], "No autorizado");
        ethPrice = _ethPrice;
        btcPrice = _btcPrice;
        usdcPrice = _usdcPrice;
        lastTimestamp = block.timestamp;
        emit PriceUpdated(_ethPrice, _btcPrice, _usdcPrice, block.timestamp);
    }

    // Funcion adicional de pull
    /*
    function requestData(address _oracle, bytes32 _jobId, uint256 _fee) public returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(_jobId, address(this), this.fulfill.selector);
        request.add("get", "API_URL");
        request.add("path", "USD");
        return sendChainlinkRequestTo(_oracle, request, _fee);
    }
    
    function fulfill(bytes32 _requestId, uint256 _price) public recordChainlinkFulfillment(_requestId) {
        ethPrice = _price;
    }
    */
}
