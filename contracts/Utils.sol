//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

/**
 * @notice pick a random number using the hash of the previous block
 * @dev TODO: improve randomness and security using Chainlin VRF 
 */
function rand() view returns (uint256) {
    bytes32 bhash = blockhash(block.number - 1);
    bytes memory bytesArray = new bytes(32);
    for (uint i; i < 32; i++) bytesArray[i] = bhash[i];
    
    return uint256(keccak256(bytesArray));
}
