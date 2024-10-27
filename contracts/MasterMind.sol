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
    mapping(uint256 => Game) private games;
    mapping(address => bool) private playing;
    uint256[] private free_games;
    uint256 gameId;

    constructor() {
        console.log("Console Log: Deployed by ");
        console.log(tx.origin);
    }

    modifier ifNotPlaying() {
        require(
            !playing[msg.sender],
            "The player is already registered for a game."
        );
        _;
    }

    modifier userAllowed(uint256 id) {
        require(
            games[id].getCodeMaker() == msg.sender ||
                games[id].getCodeBreaker() == msg.sender,
            "Denied operation."
        );
        _;
    }

    // TODO: to remove
    function forTest() external {
        // Color[4] memory code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        // uint8[5] memory salt = [0, 0, 0, 0, 0];
        // emit SecretCodeSent(address(0));
        //console.log("MASTERMIND");
        //console.log(toHexString(hashOf(code, salt)));
    }

    /**
     * @notice return the id of a random free game: pending game without a designated challenger
     *         it also remove the picked id
     * @custom:revert if there are no free games
     */
    function pickFreeGame() private returns (uint256) {
        require(free_games.length > 0, "There are no free games now.");

        uint256 k = rand() % free_games.length;
        uint256 id = free_games[k];
        free_games[k] = free_games[free_games.length - 1];
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
    function newGame (address challenger_addr) 
        public ifNotPlaying returns (uint256) {
        require(challenger_addr != msg.sender, "Cannot create a game with yourself.");

        games[gameId] = new Game(
            gameId,
            payable(msg.sender),
            payable(challenger_addr)
        );
        playing[msg.sender] = true;
        emit GameCreated(msg.sender, gameId);
        console.log("Console Log: New game created!");

        return gameId++;
    }

    /// @notice Overload with no params: create a new game without a specific challenger
    function newGame() external ifNotPlaying returns (uint256) {
        free_games.push(gameId);
        return newGame(address(0));
    }

    /**
     * @param id: identifier of the game the challenger wants to join
     * @custom:emit GameJoined
     * @custom:revert if the player is already playing a game or
     *                if the player picks an invalid id game
     */
    function joinGame(uint256 id) external ifNotPlaying {
        require(
            games[id].getCodeBreaker() == msg.sender,
            "You're not allowed to play this game."
        );

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
    function joinGame() external ifNotPlaying {
        uint256 id = pickFreeGame();
        games[id].setCodeBreaker(payable(msg.sender));
        playing[msg.sender] = true;
        emit GameJoined(msg.sender, id);
        console.log("Console Log: Game joined!");
    }

    /**
     * @notice set stake value. If the two players declare different values => close the game
     * @param id: game id
     * @param stake: stake declared by the sender
     * @custom:revert if who sent the transaction is not allowed for this game or 
     *                if _stake == 0 or 
     *                if a player attempts to declare more than one time the stake or 
     *                if this tx is sent while not in declaration phase
     * @custom:emit StakeDeclared
     *              GameClosed
     */
    function declareStake(uint256 id, uint256 stake) external userAllowed(id) {
        if ( ! games[id].declareStake(stake) ){
            emit StakeDeclared(msg.sender, stake);
            closeGame(id);
        } else emit StakeDeclared(msg.sender, stake);
    }

    /**
     * @notice close a game turning off playing[players] and games[id]
     * @param id: game id to close
     * @custom:emit GameClosed
     */
    function closeGame(uint256 id) private {
        delete playing[games[id].getCodeMaker()];
        delete playing[games[id].getCodeBreaker()];
        delete games[id];
        emit GameClosed(id);
    }

    /**
     * @notice Allow players to put stake. When both the players put it, shuffle roles
     *         If a player put a different stake from what was declared, the contract punish it
     *         and reward the other one. Furthermore, if the other player already put its stake,
     *         the cheater player pays also the gas for refunding him.
     * @param id: game id
     * @custom:emit StakePut
     *              Shuffled
     *              Punished
     *              Transfered
     *              GameClosed
     * @custom:revert if who sent the transaction is not allowed for this game
     *                if msg.value == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if invoked while not in set-stake phase
     */
    function prepareGame(uint256 id) external payable userAllowed(id) {

        emit StakePut(msg.sender, msg.value);
        if (! games[id].setStake(msg.value)){

            // stake not coincide with what was declared => punish and reward
            address toReward = games[id].getCodeMaker() == msg.sender ? 
                games[id].getCodeBreaker() : 
                games[id].getCodeMaker();

            uint256 stake = games[id].popStake();
            punishAndReward(msg.sender, payable(toReward), msg.value);

            // if the other player paied, refund him
            if (games[id].howManyPayed() == 1){
                call(payable(toReward), stake);
                emit Transfered(toReward, stake);
            }

            closeGame(id);
        } else {
        
            // shuffle players
            if (games[id].howManyPayed() == 2) {
                games[id].shuffleRoles();
                emit Shuffled(games[id].getCodeMaker(), games[id].getCodeBreaker());
            }
        }
    }

    /**
     * @param toPunish: user to punish
     * @param toReward: user to reward
     * @param stake: the reward
     * @custom:emit Punished
     *              Transfered
     */
    function punishAndReward(address toPunish, address payable toReward, uint256 stake) private {
        call(toReward, stake);
        emit Punished(toPunish);
        emit Transfered(toReward, stake);
    }

    /**
     * @notice carry out a transfering by "call" setting the gas and check the failure
     * @param _to: address to pay
     * @param value: value to transfer
     * @custom:revert if the transfer wasn't successful
     */
    function call(address payable _to, uint256 value) private {
        (bool sent, ) = _to.call{value: value, gas: 3500}(""); // set gas 
        require(sent, "Failed to send Ether");
    }

    /**
     * @notice allow a player to send the secret code
     * @param _hash: secret code, hashed and salted off-chain
     * @param id: game id 
     * @custom:emit SecretCodeSent
     * @custom:revert if msg.sender is not a player of games[id] or 
     *                if not invoked by MasterMind or 
     *                if not sent by the codeMaker or
     *                if invoked while not in phase of code submission
     */
    function sendCode(bytes32 _hash, uint256 id) external
        userAllowed(id) {
        games[id].setHash(_hash);
        emit SecretCodeSent(msg.sender);
    }

    /**
     * @notice allow the codebreaker to send the secret code
     * @param code: proposed secret code
     * @param id: game id
     * @custom:revert if invoked while not in phase of guess submission
     *                if not sent by the codebreaker or
     *                if already reached max number of guesses or 
     *                if msg.sender is not a player of games[id]
     * @custom:emit GuessSent
     */
    function sendGuess(Color[N_HOLES] calldata code, uint256 id) external userAllowed(id) {
        games[id].pushGuess(code);
        emit GuessSent(msg.sender);
    }

    /**
     * @notice allow the codemaker to send a feedback about the last guess
     * @param CC: number of colors belonging to the last guess in the correct position
     * @param NC: number of colors belonging to the last guess, but not in the correc: game id positions
     * @param id: game id
     * @custom:revert if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if already reached max number of feedbacks or 
     *                if the codemaker sent an invalid feedback
     * @custom:emit FeedbackSent
     */
    function sendFeedback(uint8 CC, uint8 NC, uint256 id) external userAllowed(id) {
        require(CC <= N_HOLES && NC <= N_HOLES && CC + NC <= N_HOLES, "Invalid feedback.");
        games[id].pushFeedback(CC, NC);
        emit FeedbackSent(msg.sender);
    }

    /**
     * @notice allow the codemaker to reveal the solution <code, salt>. Starts dispute timer.
     * @param id: game id
     * @param code: secret code he choose at the beginning
     * @param salt: numeric code to improve robustness
     * @custom:revert if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if the solution doesn't match the hash he choose at the beginning
     * @custom:emit SolutionSubmitted
     */
    function submitSolution(uint256 id, Color[N_HOLES] memory code, uint8[SALT_SZ] memory salt)  
        external userAllowed(id) {
        games[id].reveal(code, salt);
        emit SolutionSubmitted(id, code, salt);
    }
}
