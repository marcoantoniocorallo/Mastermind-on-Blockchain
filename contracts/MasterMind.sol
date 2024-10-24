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

    mapping (uint256 => Game) private games;
    mapping (address => bool) private playing;
    uint256[] private free_games;
    uint256 gameId;

    constructor() {
        console.log("Console Log: Deployed by ");
        console.log(tx.origin);
    }

    modifier ifNotPlaying {
        require ( ! playing[msg.sender], "The player is already registered for a game.");
        _;
    }

    modifier userAllowed(uint256 id) {
        require ( 
            games[id].getCodeMaker() == msg.sender ||  
            games[id].getCodeBreaker() == msg.sender,
            "Denied operation."
        );
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
    function newGame(address challenger_addr) ifNotPlaying public returns (uint256) {
        require ( challenger_addr != msg.sender, "Cannot create a game with yourself.");

        games[gameId] = new Game(gameId, payable(msg.sender), payable(challenger_addr));
        playing[msg.sender] = true;
        emit GameCreated(msg.sender, gameId);
        console.log("Console Log: New game created!");

        return gameId++;
    }

    /// @notice Overload with no params: create a new game without a specific challenger
    function newGame() ifNotPlaying external returns (uint256){ 
        free_games.push(gameId);
        return newGame(address(0)); 
    }

    /**
     * @param id: identifier of the game the challenger wants to join
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or 
     *                if the player picks an invalid id game
     */
    function joinGame(uint256 id) ifNotPlaying external {
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
        games[id].setCodeBreaker(payable(msg.sender));
        playing[msg.sender] = true;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }

    /**
     * @notice Allow players to put stake. When both the players put it, shuffle roles
     * @param id: game id
     * @custom:revert if who sent the transaction is not allowed for this game or 
     *                if the two stakes don't coincide
     */
    function prepareGame(uint256 id) userAllowed(id) payable external {
        // if stakes not coincide => revert and refund
        if (games[id].howManyPayed() == 1 &&  games[id].getStake() != msg.value) {
            revertFirstPlayerPayment(id);
            revert("The two stakes not coincide.");
        }
        
        // set stake
        games[id].setStake(msg.value);
        emit StakePut(msg.sender, msg.value);

        // shuffle players
        if (games[id].howManyPayed() == 2){
            games[id].shuffleRoles();
            emit Shuffled(games[id].getCodeMaker(), games[id].getCodeBreaker());
        }
    }

    function revertFirstPlayerPayment(uint256 id) private {
        payable(games[id].whoPayed())
            .transfer(games[id].getStake());
    }

    function putCode(bytes32[] calldata _hash, uint256 id) userAllowed(id) external {
        games[id].setHash(_hash);
    }

}