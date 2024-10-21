//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Game.sol";
import "./Events.sol";
import "./Constants.sol";

/**
 * @title  MasterMind
 * @author Marco Antonio Corallo 
 * @notice An implementation of MasterMind on Ethereum Blockchain
 */
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

    /**
     * @notice Checks if a given user is already playing a game or already created a game
     * @param user: user who want to query
     * @return  true if user is already playing a game
     *          true if user created a game and is waiting for the challenger
     *          false otherwise
     */
    function isPlaying(address user) private view returns (bool) {
        for (uint8 i = 0; i < games.length; ++i)
            if  (games[i].codeMaker == user || 
                (!games[i].pending && games[i].codeBreaker == user)
            )   return true;
        
        return false;
    }

    /**
     * @notice return the id of the first free game: pending game without a designated challenger
     * @custom:revert if there are no free games
     */
    function firstFreeGame() private view returns (uint8){
        for (uint8 i = 0; i < games.length; ++i)
            if (games[i].pending && games[i].codeBreaker == address(0))
                return i;

        revert("There are no free games now.");
    }

    /**
     * @notice Create a new game
     * @param challenger_addr: address of the player the game creator wants to play with
     *                         or address(0)
     * @return new game's id
     * @custom:emit GameCreated
     * @custom:revert if the player is already registered for a game or 
     *                if there are already MAX_GAMES games
     */
    function newGame(address challenger_addr) public returns (uint8) {
        require ( challenger_addr != msg.sender, "Cannot create a game with yourself.");
        require ( ! isPlaying(msg.sender), "The player is already registered for a game.");
        require ( games.length < MAX_GAMES, "There are too many games. Try again in a few moments." );

        games.push(
            Game(
                msg.sender, 
                challenger_addr,
                true,
                0
            )
        );
        emit GameCreated(msg.sender, games.length-1);
        console.log("Console Log: New game created!");

        return uint8(games.length-1);
    }

    /// @notice Overload with no params: create a new game without a specific challenger
    function newGame() external returns (uint8){ return newGame(address(0)); }

    /**
     * @notice Join a specific game
     * @param id: identifier of the game the challenger wants to join
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or 
     *                if the player picks an invalid id game
     */
    function joinGame(uint8 id) external {
        require(!isPlaying(msg.sender), "The player is already registered for a game.");
        require(games[id].pending && games[id].codeBreaker == msg.sender,"You're not allowed to play this game.");

        games[id].pending = false;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }

    /**
     * @notice Overload with no params: join a random game
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or 
     *                if there are no free games
     */
    function joinGame() external {
        require(!isPlaying(msg.sender), "The player is already registered for a game.");

        uint8 id = firstFreeGame();
        games[id].codeBreaker = msg.sender;
        games[id].pending = false;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }
}