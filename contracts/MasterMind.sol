//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Game.sol";
import "./Events.sol";
import "./Constants.sol";
import "./Utils.sol";

using GameLib for Game;

/**
 * @title  MasterMind
 * @author Marco Antonio Corallo
 * @notice An implementation of MasterMind on Ethereum Blockchain
 */
contract MasterMind {
    mapping(uint256 => Game) private games;
    mapping(address => bool) private playing;
    uint256[] private free_games;
    uint256 private gameId;

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

    modifier handleAFK(uint256 id){
        bool afk = false;
        if (games[id].AFK != address(0)) afk = true;
        _;
        if (afk && games[id].AFK == address(0))
            emit AFKStop(id);
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

        games[gameId].newGame(
            gameId,
            payable(msg.sender),
            payable(challenger_addr)
        );

        playing[msg.sender] = true;
        emit GameCreated(msg.sender, gameId);

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

        games[id].setCodeBreaker(payable(msg.sender)); // just increase the game phase
        playing[msg.sender] = true;
        emit GameJoined(msg.sender, id);
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
    function declareStake(uint256 id, uint256 stake) external userAllowed(id) handleAFK(id) {
        if ( ! games[id].declareStake(stake) ){
            emit StakeDeclared(id, msg.sender, stake);
            closeGame(id);
        } else emit StakeDeclared(id, msg.sender, stake);
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
     *         If a player put a different stake from what was declared, the tx is reverted.
     * @param id: game id
     * @custom:emit StakePut
     *              Shuffled
     * @custom:revert if who sent the transaction is not allowed for this game
     *                if msg.value == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if invoked while not in set-stake phase or 
     *                if invoked with a stake different from what was declared
     */
    function prepareGame(uint256 id) external payable userAllowed(id) handleAFK(id) {

        emit StakePut(id, msg.sender, msg.value);
        games[id].setStake(msg.value);

        // shuffle players
        if (games[id].howManyPayed() == 2) {
            games[id].shuffleRoles();
            emit Shuffled(id, games[id].getCodeMaker(), games[id].getCodeBreaker());
        }
    }

    /**
     * @param toPunish: user to punish
     * @param toReward: user to reward
     * @param stake: the reward
     * @custom:emit Punished
     *              Transfered
     */
    function punishAndReward(uint256 id, address toPunish, address payable toReward, uint256 stake) private {
        call(toReward, stake);
        emit Punished(id, toPunish);
        emit Transfered(id, toReward, stake);
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
        userAllowed(id) handleAFK(id) {
        games[id].setHash(_hash);
        emit SecretCodeSent(id, msg.sender);
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
    function sendGuess(Color[N_HOLES] calldata code, uint256 id) external 
        userAllowed(id) handleAFK(id) {
        games[id].pushGuess(code);
        emit GuessSent(id, msg.sender, code);
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
    function sendFeedback(uint8 CC, uint8 NC, uint256 id) external 
        userAllowed(id) handleAFK(id){
        require(CC <= N_HOLES && NC <= N_HOLES && CC + NC <= N_HOLES, "Invalid feedback.");
        games[id].pushFeedback(CC, NC);
        emit FeedbackSent(id, msg.sender, CC, NC);
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
        external userAllowed(id) handleAFK(id){
        games[id].reveal(code, salt);
        emit SolutionSubmitted(id, code, salt);
    }

    /**
     * @notice allow the codebreaker to start a dispute on a given feedback
     * @param id: game id 
     * @param feedback_id: reference to the disputed feedback
     * @custom:revert if not sent by the codebreaker or
     *                if invoked while in another phase or
     *                if the tx has been sent after the slot closes
     * @custom:emit Dispute
     *              Punished
     *              Transfered
     *              GameClosed
     */
    function startDispute(uint256 id, uint8 feedback_id) external 
        userAllowed(id) {
        require(feedback_id < N_GUESSES, "Feedback ID not valid.");
        
        emit Dispute(id, feedback_id);
        uint256 stake = games[id].popStake();
        if (games[id].correctFeedback(feedback_id))
            punishAndReward(id, games[id].getCodeBreaker(), payable(games[id].getCodeMaker()), stake*2);
        else 
            punishAndReward(id, games[id].getCodeMaker(), payable(games[id].getCodeBreaker()), stake*2);
        
        closeGame(id);
    }

    /**
     * @notice after the dispute time update points and, if all turns have been played, draw winner 
     * @param id: game id
     * @custom:revert if user not allowed to play this game or
     *                if invoked while in another phase or
     *                if the dispute time has not been over yet.
     * @custom:emit PointsUpdated
     *              Tie
     *              Transfered
     *              Winning
     *              GameClosed
     *              Shuffled
     */
    function updateScore(uint256 id) external userAllowed(id) {
        (uint8 points, uint8 turn) = games[id].getPoints();
        emit PointsUpdated(id, points);

        if (turn == N_TURNS){
            address winner = games[id].whoWon();
            uint256 stake = games[id].popStake();
            if (winner == address(0)) {
                emit Tie(id);
                
                call(payable(games[id].getCodeMaker()), stake);
                emit Transfered(id, games[id].getCodeMaker(), stake);

                call(payable(games[id].getCodeBreaker()), stake);
                emit Transfered(id, games[id].getCodeBreaker(), stake);

            } else{
                emit Winning(id, winner);
                call(payable(winner), stake * 2);
                emit Transfered(id, winner, stake * 2);
            }
            closeGame(id);
        }
        else emit Shuffled(id, games[id].getCodeMaker(), games[id].getCodeBreaker());
    }

    /**
     * @notice sender put under accusation the opponent
     * @param id: game id
     * @custom:revert if the player who accuse is the same who must move or
     *                if in this phase is not possible to accuse (Creation, Dispute, Closing)
     * @custom:emit AFK
     */
    function AFK(uint256 id) external userAllowed(id) {
        address opponent = msg.sender == games[id].getCodeMaker() ? 
            games[id].getCodeBreaker() : games[id].getCodeMaker();
        games[id].accuseAFK(opponent);
        emit AFKStart(id, opponent);
    }

    /**
     * @notice transfer the stake to the player that accuse and win the AFK
     * @param id: game id 
     * @custom:revert if invoked by the accused player or 
     *                if the AFK time is not over yet or 
     *                if the user is not allowed for this game
     * @custom:emit Winning
     *              Transfered
     *              GameClosed
     */
    function claimStakeByAFK(uint256 id) external userAllowed(id) {
        uint256 award = games[id].winByAFK();
        if (award != 0){
            emit Winning(id, msg.sender);
            call(payable(msg.sender), award);
            emit Transfered(id, msg.sender, award);
        }
        closeGame(id);
    }

    /**
     * @notice Allow a player to leave the game. 
     *         If the stake has already been put, the give-up player lose the game.
     * @param id: game id 
     * @custom:revert if the user is not allowed for this game
     * @custom:emit Winning
     *              Transfered
     *              GameClosed
     *              GameLeft
     */
    function leaveGame(uint256 id) external userAllowed(id){
        emit GameLeft(id, msg.sender);

        uint256 stake = games[id].popStake();
        if (games[id].howManyPayed() == 1) {
            address whoPayed = games[id].payedBy[0];
            call(payable(whoPayed), stake);
            emit Transfered(id, whoPayed, stake);
        } else if (games[id].howManyPayed() == 2) {
            address opponent = msg.sender == games[id].getCodeMaker() ? 
                games[id].getCodeBreaker() : games[id].getCodeMaker();
            call(payable(opponent), stake * 2);
            emit Winning(id, opponent);
            emit Transfered(id, opponent, stake * 2);
        }
        
        if (games[id].phase == Phase.Creation && games[id].codeBreaker == address(0))
            removeFreeGame(id);

        closeGame(id);
    }

    /**
     * @notice remove a game_id from the list of free games.
     *         This feature need to scan the entire free games list,
     *         but it should not generally be to much long. 
     *         Furthermore, it may be considered a discouragement to continue to play instead of leaving.
     * @param id : game id to remove
     */
    function removeFreeGame(uint256 id) private {
        for (uint i = 0; i < free_games.length; i++)
            if (free_games[i] == id) {
                free_games[i] = free_games[free_games.length-1];
                free_games.pop();
                return;
            }
    }
}