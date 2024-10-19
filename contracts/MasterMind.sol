//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Game.sol";
import "./Events.sol";

contract MasterMind {

    Game[] private games;

    // probably to remove: minimize the number of state vars
    uint256 colors = 6; // we chose 4 colors in an umbrella of 6 colors
    uint256 holes = 4;  // duplicate colors are allowed
    uint256 guesses = 8;// 8 guesses in a set
    uint256 turns = 3;  // number of sets in a game

    constructor() {
        console.log("Console Log: Deployed by ");
        console.log(tx.origin);
    }
    
    function alreadyPresent(address user) private view returns (bool) {
        for (uint i = 0; i < games.length; ++i)
            if (games[i].codeMaker == user || games[i].codeBreaker == user)
                return true;
        return false;
    }

    function newGame() external {
        require (! alreadyPresent(msg.sender), "The player is already registered for a game.");

        if (games.length > 0 && games[games.length-1].pending) {
            games[games.length-1].codeBreaker = msg.sender;
            games[games.length-1].pending = false;
            emit GameJoined(msg.sender, games.length-1);
            console.log("Console Log: Game joined!");
        } else{
            Game memory game;
            game.codeMaker = msg.sender;
            game.pending = true;
            games.push(game);
            emit GameCreated(msg.sender, games.length-1);
            console.log("Console Log: New game created!");
        }
    }
}