//SPDX-License-Identifier: CC-BY-1.0

pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract Game {

    constructor() {
        console.log("Deployed!");
        console.log(msg.sender);
    }
    
    function newGame() external pure {
        console.log("new game created!");
    }
}