//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Constants.sol";

/**
 * @notice pick a random number using the hash of the previous block
 * @dev TODO: improve randomness and security using Chainlin VRF - subscription required
 */
function rand() view returns (uint256) {
    bytes32 bhash = blockhash(block.number - 1);
    bytes memory bytesArray = new bytes(32);
    for (uint i; i < 32; i++) bytesArray[i] = bhash[i];
    
    return uint256(keccak256(bytesArray));
}

/**
 * @notice used to verify the solution
 * @param code: the color code
 * @param salt: a salt chosen by the user to improve robustness 
 */
function hashOf(Color[N_HOLES] memory code, uint8[SALT_SZ] memory salt) pure returns (bytes32) {
    bytes memory packed;
    for (uint i = 0; i < N_HOLES; i++) packed = abi.encodePacked(packed, uint8(code[i]));
    for (uint i = 0; i < SALT_SZ; i++) packed = abi.encodePacked(packed, uint8(salt[i]));
    return keccak256(abi.encodePacked(packed));
}

/// @notice Utility to compare two array
function equalCodes(Color[N_HOLES] storage code1, Color[N_HOLES] storage code2) view returns (bool) {
    for (uint i = 0; i < N_HOLES; i++)
        if (code1[i] != code2[i]) return false;
    return true;
}