//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Game.sol";
import "./Events.sol";
import "./Constants.sol";
import "./Utils.sol";

/**
 * @title  MasterMind
 * @author Marco Antonio Corallo 
 * @notice An implementation of MasterMind on Ethereum Blockchain
 */
contract MasterMind {

    uint256 gameId;
    mapping (uint256 => Game) private games;
    uint256[] private free_games;
    mapping (address => bool) private playing;

    constructor() {
        console.log("Console Log: Deployed by ");
        console.log(tx.origin);
    }

    modifier ifNotPlaying {
        require ( ! playing[msg.sender], "The player is already registered for a game.");
        _;
    }

    /**
     * @notice return the id of a random free game: pending game without a designated challenger
     *         it also remove the picked id
     * @custom:revert if there are no free games
     */
    function pickFreeGame() private returns (uint256){
        require(free_games.length > 0, "There are no free games now.");

        uint256 k = rand() % free_games.length;
        uint256 id = free_games[k];
        free_games[k] = free_games[free_games.length-1];
        free_games.pop();
        return id;
    }

    /**
     * @param challenger_addr: address of the player the game creator wants to play with
     *                         or address(0)
     * @return game's id
     * @custom:emit GameCreated
     * @custom:revert if the player is already registered for a game or 
     *                if the player attempts to create a game with himself
     */
    function newGame(address challenger_addr) ifNotPlaying public returns (uint8) {
        require ( challenger_addr != msg.sender, "Cannot create a game with yourself.");

        games[gameId] = new Game(address(this), gameId, msg.sender, challenger_addr);
        playing[msg.sender] = true;
        emit GameCreated(msg.sender, gameId);
        console.log("Console Log: New game created!");

        return uint8(gameId++);
    }

    /// @notice Overload with no params: create a new game without a specific challenger
    function newGame() ifNotPlaying external returns (uint8){ 
        free_games.push(gameId);
        return newGame(address(0)); 
    }

    /**
     * @param id: identifier of the game the challenger wants to join
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or 
     *                if the player picks an invalid id game
     */
    function joinGame(uint8 id) ifNotPlaying external {
        require(games[id].getCodeBreaker() == msg.sender,"You're not allowed to play this game.");

        playing[msg.sender] = true;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }

    /**
     * @notice Overload with no params: join a random game
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or 
     *                if there are no free games
     */
    function joinGame() ifNotPlaying external {
        uint256 id = pickFreeGame();
        games[id].setCodeBreaker(msg.sender);
        playing[msg.sender] = true;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }
}