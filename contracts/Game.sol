//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";
import "./Constants.sol";
import "hardhat/console.sol";

/**
 * @title Game
 * @author Marco Antonio Corallo
 * @notice Single game composed by several turns
 */
struct Game{
    uint256 id;
    address codeMaker;                  // initially it's the creator of the game
    address codeBreaker;                // initially it's the challenger
    uint256 stake;                      // agreed off-chain
    address[] declaredBy;               // who already declared the stake?
    address[] payedBy;                  // who already put the money?
    bytes32 hash;                       // computed and salted off-chain
    Phase phase;                        // phase of the game: state-machine
    uint8 n_guess;                      // how many guesses codebreaker sent?
    uint8 turn;                         // a game is composed by several turns
    uint256 start_block_n;              // block number where the dispute/AFK starts
    address AFK;                        // user accused to be AFK
    mapping (address => uint8) points;
    Color[N_HOLES] solution;
    Color[N_HOLES][N_GUESSES][N_TURNS] guesses;
    uint8[2][N_FEEDBACKS][N_TURNS] feedbacks;
}

/**
 * @title GameLib
 * @author Marco Antonio Corallo
 * @notice Provides methods and utilities to operate on Game structs
 */
library GameLib {

    // constructor
    function newGame(Game storage self, uint256 _id, address  _codeMaker, address  _codeBreaker) external {
        (self.id,  self.codeMaker,  self.codeBreaker,   self.phase) = 
        (    _id,      _codeMaker,      _codeBreaker,   Phase.Creation);
    }

    /// @notice checks that the function is originally invoked by the codemaker
    modifier codeMakerTurn(Game storage self) {
        require(msg.sender == self.codeMaker, "Denied operation.");
        _;
    }

    /// @notice checks that the function is originally invoked by the codebreaker
    modifier codeBreakerTurn(Game storage self) {
        require(msg.sender == self.codeBreaker, "Denied operation.");
        _;
    }

    /// @notice checks that the functions is called in the correct phase
    modifier checkPhase(Game storage self, Phase _phase) {
        require(self.phase == _phase, "Operation not allowed now.");
        _;
    }

    modifier otherPlayerTurn(Game storage self){
        require(
            self.phase != Phase.Creation && 
            self.phase != Phase.Dispute &&
            self.phase != Phase.Closing,
            "Cannot put under accusation now."
        );

        if (
            self.phase == Phase.SecretCode    || 
            self.phase == Phase.Feedback      ||
            self.phase == Phase.Solution
        )   require(msg.sender == self.codeBreaker,  "Denied operation.");
        else if ( self.phase == Phase.Guess )
            require(msg.sender == self.codeMaker,    "Denied operation.");
        else if ( self.phase == Phase.Declaration )
            require(
                (self.declaredBy.length == 1 && self.declaredBy[0] == msg.sender),
                "Must do your move before to accuse to be AFK."
            );
        else if ( self.phase == Phase.Preparation )
            require(
                (self.payedBy.length == 1 && self.payedBy[0] == msg.sender),
                "Must do your move before to accuse to be AFK."
            );
        _;
    }

    /**
     * @notice when a player accused to be AFK moves, checks the block number.
     *         if still in time, reset the timer and continue, otherwise revert.
     */
    modifier checkAFK(Game storage self){
        require(
            self.AFK == address(0) || self.AFK == msg.sender, 
            "Wait for the other player or for the time to run out."
        );
        require(
            self.AFK == address(0) || 
            block.number <= self.start_block_n + (DISPUTE_TIME / BLOCK_SPAWN_RATE),
            "You have been AFK too long."
        );
        self.AFK = address(0);
        _;
    }

    function getCodeMaker(Game storage self) external view 
        returns (address) { return self.codeMaker; }

    function getCodeBreaker(Game storage self) external view 
        returns (address) { return self.codeBreaker; }

    /// @notice after set the codebreaker, updates the phase of the game
    function setCodeBreaker(Game storage self, address  _codeBreaker) 
        checkPhase(self, Phase.Creation) external {
        self.codeBreaker = _codeBreaker;
        self.phase = Phase.Declaration;
    }

    function howManyPayed(Game storage self) external view 
        returns (uint256) { return self.payedBy.length; }

    /// @notice getter for stake, but it reset the value to avoid possible reentrancy oversight
    function popStake(Game storage self) external returns (uint256) {
        uint256 tmp = self.stake;
        delete self.stake;
        return tmp;
    }

    /**
     * @notice shuffle the roles (codemaker/codebreaker) of the id-th game
     *  when the game is created, the creator is codeMaker and the challenger is codeBreaker,
     *  just to optimize variables (=> gas!). This function probabilistically revert them.
     *  In the end, it updates the phase of the game
     * @custom:revert if the stakes put by the two players doesn't coincide or
     *                if invoked while in another phase
     */
    function shuffleRoles(Game storage self) external
        checkPhase(self, Phase.Preparation) checkAFK(self) {
        require(self.payedBy.length == 2, "Both the player must put stake to start the game.");
        if (rand() % 2 == 0)
            (self.codeMaker, self.codeBreaker) = (self.codeBreaker, self.codeMaker);

        self.phase = Phase.SecretCode;
    }

    /**
     * @notice allow the players to declare the stake
     * @param _stake: stake that they agreed on off-chain
     * @return false if the stakes declared by the two players don't coincide
     *         true otherwise
     * @custom:revert if _stake == 0 or 
     *                if a player attempts to declare more than one time the stake or 
     *                if this tx is sent while in another phase
     */
    function declareStake(Game storage self, uint256 _stake) external
        checkPhase(self, Phase.Declaration) checkAFK(self) returns (bool) {
        require(_stake > 0, "Stake must be greater than zero.");
        require(
            self.declaredBy.length == 0 || 
            (self.declaredBy.length == 1 && self.declaredBy[0] != msg.sender),
            "You already declared stake."
        );

        if (self.declaredBy.length == 1 && self.stake != _stake) 
            return false;

        self.stake = _stake;
        self.declaredBy.push(msg.sender);

        if (self.declaredBy.length == 2)
            self.phase = Phase.Preparation;

        return true;
    }

    /**
     * @notice get player' stakes; 
     *         if a player put a different stake from what was declared, revert.
     * @custom:revert if _stake == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if invoked while in another phase or 
     *                if invoked with a stake different frmo what was declared
     */
    function setStake(Game storage self, uint256 _stake) external
        checkPhase(self, Phase.Preparation) checkAFK(self) {
        require(_stake > 0, "Stake must be greater than zero.");
        require(
            self.payedBy.length == 0 || (self.payedBy.length == 1 && self.payedBy[0] != msg.sender),
            "Cannot put money again."
        );
        require( _stake == self.stake, "Wrong stake.");

        self.payedBy.push(msg.sender);
    }

    /**
     * @param _hash: hash of a secret code, computed off-chain. Then update the phase.
     * @custom:revert if not sent by the codeMaker or
     *                if invoked while in another phase
     */
    function setHash(Game storage self, bytes32 _hash) external
        codeMakerTurn(self) checkPhase(self, Phase.SecretCode) checkAFK(self) {
        self.hash = _hash;
        self.phase = Phase.Guess;
    }

    /**
     * @notice allow the codebreaker to send a guess, then update the phase.
     * @param _guess: proposed secret code
     * @custom:revert if not sent by the codebreaker or
     *                if invoked while in another phase or
     *                if already reached max number of guesses
     */
    function pushGuess(Game storage self, Color[N_HOLES] calldata _guess) external
        codeBreakerTurn(self) checkPhase(self, Phase.Guess) checkAFK(self) {
        require(self.n_guess < N_GUESSES, "Max number of guesses reached.");
        self.guesses[self.turn][self.n_guess++] = _guess;
        self.phase = self.n_guess < N_GUESSES ? Phase.Feedback : Phase.Solution;
    }

    /**
     * @notice allow the codemaker to send a feedback about the last guess, then update the phase.
     * @param CC: number of colors belonging to the last guess in the correct position
     * @param NC: number of colors belonging to the last guess, but not in the correct positions
     * @custom:revert if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if already reached max number of feedbacks
     */
    function pushFeedback(Game storage self, uint8 CC, uint8 NC) external
        codeMakerTurn(self) checkPhase(self, Phase.Feedback) checkAFK(self) {
        self.feedbacks[self.turn][self.n_guess-1][0] = CC;
        self.feedbacks[self.turn][self.n_guess-1][1] = NC;
        self.phase = CC < N_HOLES ? Phase.Guess : Phase.Solution;
    }

    /**
     * @notice codemaker submit solution <code, salt>. 
     *         Then update the phase and starts timer for dispute.
     * @param code: secret code he choose at the beginning
     * @param salt: numeric code to improve robustness
     * @custom:revert if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if the solution doesn't match the hash he choose at the beginning
     */
    function reveal(Game storage self, Color[N_HOLES] memory code, uint8[SALT_SZ] memory salt) external 
        codeMakerTurn(self) checkPhase(self, Phase.Solution) checkAFK(self) {
        require(hashOf(code, salt) == self.hash, "Invalid Solution.");
        self.solution = code;
        self.start_block_n = block.number;
        self.phase = Phase.Dispute;
    }

    /**
     * @notice verify the correctness of a disputed feedback
     * @param feedback: the id of the disputed feedback
     * @return true if the given feedback is correct, false otherwise
     * @custom:revert if not sent by the codebreaker or
     *                if invoked while in another phase or
     *                if the tx has been sent after the slot closes
     */
    function correctFeedback(Game storage self, uint8 feedback) view external
        codeBreakerTurn(self) checkPhase(self, Phase.Dispute) returns (bool) {
        require(block.number <= self.start_block_n + (DISPUTE_TIME / BLOCK_SPAWN_RATE), "Time Over.");
        
        uint8 CC_count = 0; uint8 NC_count = 0;
        (uint8 CC, uint8 NC) = (self.feedbacks[self.turn][feedback][0], self.feedbacks[self.turn][feedback][1]);
        bool[N_HOLES] memory used_in_solution;
        bool[N_HOLES] memory used_in_guess;

        // correct positions for correct colors
        for (uint8 i = 0; i < N_HOLES; i++) {
            if (self.guesses[self.turn][feedback][i] == self.solution[i]) {
                CC_count++;
                used_in_solution[i] = true;
                used_in_guess[i] = true;
            }
        }

        // correct colors in the wrong positions
        for (uint i = 0; i < N_HOLES; i++) {
            if (used_in_guess[i]) continue;  

            for (uint j = 0; j < N_HOLES; j++) {
                if (used_in_solution[j]) continue; 

                if (self.solution[j] == self.guesses[self.turn][feedback][i]) {
                    NC_count++;
                    used_in_solution[j] = true;
                    break;
                }
            }
        }
        
        return (CC == CC_count && NC == NC_count);
    }

    /**
     * @notice allows the player to get the updated points after dispute time. 
     *         Then, update Phase and Turn.
     * @return a pair <points, turn>
     * @custom:revert if invoked while in another phase or
     *                if the dispute time has not been over yet.
     */
    function getPoints(Game storage self) external
        checkPhase(self, Phase.Dispute) returns (uint8, uint8){
        require(
            block.number >= self.start_block_n + (DISPUTE_TIME / BLOCK_SPAWN_RATE), 
            "Dispute time not Over yet."
        );

        self.points[self.codeMaker] += 
            self.n_guess + (
                equalCodes(self.guesses[self.turn][self.n_guess-1], self.solution) ? 
                EXTRA_POINTS : 0
            );
        
        self.n_guess = 0;
        self.turn++;
        (self.codeMaker, self.codeBreaker) = (self.codeBreaker, self.codeMaker);
        self.phase = self.turn == N_TURNS ? Phase.Closing : Phase.SecretCode;
        
        return (self.points[self.codeMaker], self.turn);
    }

    /**
     * @notice get the winner
     * @return winner address
     * @custom:revert if invoked while the game is in progress
     */
    function whoWon(Game storage self) external view checkPhase(self, Phase.Closing) returns(address){
        return  self.points[self.codeMaker] == self.points[self.codeBreaker] ? address(0) :
                self.points[self.codeMaker] >  self.points[self.codeBreaker] ? self.codeMaker : self.codeBreaker;
    }

    /**
     * @notice allow a player to accuse to be AFK the opponent, starting the block timer
     * @custom:revert if the player who accuse is the same who must move or
     *                if in this phase is not possible to accuse (Creation, Dispute, Closing)
     */
    function accuseAFK(Game storage self, address opponent) external otherPlayerTurn(self) {
        self.AFK = opponent;
        self.start_block_n = block.number;
    }

    /**
     * @notice allows the accuser to claim his reward
     * @return the amount of the reward
     * @custom:revert if invoked by the accused player or 
     *                if the AFK time is not over yet
     */
    function winByAFK(Game storage self) external returns(uint256) {
        require(self.AFK != address(0) && self.AFK != msg.sender, "Denied operation.");
        require(
            block.number >= self.start_block_n + (DISPUTE_TIME / BLOCK_SPAWN_RATE), 
            "AFK time not Over yet."
        );

        uint256 stake = self.stake; 
        delete self.stake;
        
        if ( self.phase == Phase.Declaration ) return 0;        // nobody paid
        if ( self.phase == Phase.Preparation ) return stake;    // only the accuser paid
        else return stake * 2;                                  // both paid
    }
   
}