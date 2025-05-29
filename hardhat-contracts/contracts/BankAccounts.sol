// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract BankAccounts {

    struct BankNode {
        string name;
        address account;
        string publicKey;
        string enode;
        string rpcEndpoint;
    }

    // Mapping of bank nodes: public key => BankNode
    mapping(string => BankNode) public bankNodes;

    // Counter for the number of bank nodes
    uint256 public bankNodeCount;

    string[] private publicKeys;

    constructor() {
        // Add genesis nodes of the blockchain
        // THey must already be on the allowlist by default on their genesis files
        addNode(
            "Genesis node A",
            "69e84b9c135d789b637ba454fdcf7c348b3fcee0713e248c1e3edcc652088563ae5a4fd0698f7f796b875bd8008c9197022e7c15c3680e8b7cb7ec68f8b33dfa",
            "enode://69e84b9c135d789b637ba454fdcf7c348b3fcee0713e248c1e3edcc652088563ae5a4fd0698f7f796b875bd8008c9197022e7c15c3680e8b7cb7ec68f8b33dfa@172.20.0.3:30303",
            address(0x42868199703c1E0c03f065592832B60683b2FF89),
            "http://172.20.0.3:8545"
        );
        addNode(
            "Genesis node B",
            "18808d740470a14ca76548ca37643e69806f562b36453c4f72e36bc9f73e01bce9de5e924f4fd3a2540f748bd9afe198f9076ee9eebc200bb70e928d6cf43d20",
            "enode://18808d740470a14ca76548ca37643e69806f562b36453c4f72e36bc9f73e01bce9de5e924f4fd3a2540f748bd9afe198f9076ee9eebc200bb70e928d6cf43d20@172.20.0.4:30303",
            address(0xA3910a31FA74691699DcFF38393F0A9E15888CB7),
            "http://172.20.0.4:8545"
        );
        addNode(
            "Genesis node C",
            "9d5ff4e2ed29f331e811e8b04374c96a1159d8ab11264e4e79b2a59583dfee6de14cf6b2051e3ba7d2cc58f638b9f9b6a1d89053a4de1fc02527d6b883c693d9",
            "enode://9d5ff4e2ed29f331e811e8b04374c96a1159d8ab11264e4e79b2a59583dfee6de14cf6b2051e3ba7d2cc58f638b9f9b6a1d89053a4de1fc02527d6b883c693d9@172.20.0.5:30303",
            address(0xC86173e09503f0E1E6579038142C45154F4128e5),
            "http://172.20.0.5:8545"
        );
        addNode(
            "Genesis node D",
            "2eb312fe0877afffc6ea042438bbe33b7b4fcb273b06b1bb8b86237cc793d3837aa6b53c8d56b297c83c549c20f4ac69b3a9ddf0081c827d98f40fec2ef3eb56",
            "enode://2eb312fe0877afffc6ea042438bbe33b7b4fcb273b06b1bb8b86237cc793d3837aa6b53c8d56b297c83c549c20f4ac69b3a9ddf0081c827d98f40fec2ef3eb56@172.20.0.6:30303",
            address(0xfEd757455747c3E9F2716e0a7fA73aEE30556639),
            "http://172.20.0.6:8545"
        );
    }

    // ~ ~ ~ ~ ~ ~ ~ CREATE Methods ~ ~ ~ ~ ~ ~ ~ //

    // Add a new bank node
    function addNode(string memory name, string memory publicKey, string memory enode, address account, string memory rpcEndpoint) public {
        bankNodes[publicKey] = BankNode(name, account, publicKey, enode, rpcEndpoint);
        publicKeys.push(publicKey);
        bankNodeCount++;
    }

    // ~ ~ ~ ~ ~ ~ ~ UPDATE Methods ~ ~ ~ ~ ~ ~ ~ //

    // Update the name of a bank node
    function updateNodeName(string memory publicKey, string memory name) public {
        bankNodes[publicKey].name = name;
    }

    // Update the public key of a bank node
    function updateNodePrivateKey(string memory oldPublicKey, string memory newPublicKey) public {
        BankNode storage node = bankNodes[oldPublicKey];
        node.publicKey = newPublicKey;
        bankNodes[newPublicKey] = node;
        delete bankNodes[oldPublicKey];
    }

    // Update the enode of a bank node
    function updateNodeEnode(string memory publicKey, string memory enode) public {
        bankNodes[publicKey].enode = enode;
    }

    // Update the account of a bank node
    function updateNodeAccount(string memory publicKey, address account) public {
        bankNodes[publicKey].account = account;
    }

    // Update the rpc endpoint of a bank node
    function updateNodeRpcEndpoint(string memory publicKey, string memory rpcEndpoint) public {
        bankNodes[publicKey].rpcEndpoint = rpcEndpoint;
    }

    // ~ ~ ~ ~ ~ ~ ~ REMOVE Methods ~ ~ ~ ~ ~ ~ ~ //

    // Remove a bank node
    function removeNode(string memory publicKey) public {
        delete bankNodes[publicKey];
    }

    // ~ ~ ~ ~ ~ ~ ~ GET Methods ~ ~ ~ ~ ~ ~ ~ //

    // Get the name of a bank node
    function getNodeName(string memory publicKey) public view returns (string memory) {
        return bankNodes[publicKey].name;
    }

    // Get the account of a bank node
    function getNodeAccount(string memory publicKey) public view returns (address) {
        return bankNodes[publicKey].account;
    }

    // Get the enode of a bank node
    function getNodeEnode(string memory publicKey) public view returns (string memory) {
        return bankNodes[publicKey].enode;
    }

    // Get a bank node by its public key
    function getNode(string memory publicKey) public view returns (BankNode memory) {
        return bankNodes[publicKey];
    }

    // Get the rpc endpoint of a bank node
    function getNodeRpcEndpoint(string memory publicKey) public view returns (string memory) {
        return bankNodes[publicKey].rpcEndpoint;
    }

    // Check if a bank node exists
    function nodeExists(string memory publicKey) public view returns (bool) {
        return keccak256(abi.encodePacked(bankNodes[publicKey].publicKey)) == keccak256(abi.encodePacked(publicKey));
    }

    // Check if an account exists
    function accountExists(address account) public view returns (bool) {
        for (uint256 i = 0; i < bankNodeCount; i++) {
            if (bankNodes[string(abi.encodePacked(i))].account == account) {
                return true;
            }
        }
        return false;
    }

    // Check if combination of node public key and bank name exists
    function nodeExistsByName(string memory publicKey, string memory name) public view returns (bool) {
        return keccak256(abi.encodePacked(bankNodes[publicKey].name)) == keccak256(abi.encodePacked(name));
    }

    // ~ ~ ~ ~ ~ ~ ~ GET ALL Methods ~ ~ ~ ~ ~ ~ ~ //

    // Get all bank nodes
    function getAllBankNodes() public view returns (BankNode[] memory) {
        BankNode[] memory nodes = new BankNode[](publicKeys.length);
        for (uint256 i = 0; i < publicKeys.length; i++) {
            nodes[i] = bankNodes[publicKeys[i]];
        }
        return nodes;
    }

}