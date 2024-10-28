//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";
import "./Constants.sol";
import "hardhat/console.sol";

/**
 * @title Game
 * @author Marco Antonio Corallo
 * @notice Contract for a single game composed by several turns
 */
contract Game{
    uint256 private id;
    address private MasterMindAddr; // stored to check against who sent the transaction
    address private codeMaker;      // initially it's the creator of the game
    address private codeBreaker;    // initially it's the challenger
    uint256 private stake;          // agreed off-chain
    address[] private declaredBy;   // who already declared the stake?
    address[] private payedBy;      // who already put the money?
    bytes32 private hash;           // computed and salted off-chain
    Phase private phase;            // phase of the game: state-machine
    uint8 private n_guess;          // how many guesses codebreaker sent?
    uint8 private turn;             // a game is composed by several turns
    uint256 private dispute_block;  // block number where the dispute starts
    mapping (address => uint8) private points;
    Color[N_HOLES] private solution;
    Color[N_HOLES][N_GUESSES][N_TURNS] private guesses;
    uint8[2][N_FEEDBACKS][N_TURNS] private feedbacks;

    constructor(uint256 _id, address  _codeMaker, address  _codeBreaker){
        (MasterMindAddr,    id,     codeMaker,  codeBreaker, phase) = 
        (msg.sender,       _id,    _codeMaker, _codeBreaker, Phase.Creation);
    }

    /// @notice checks that the function is invoked legally by the MasterMind contract
    ///         note: MasterMind checks that the sender is allowed to access this game
    modifier calledByMasterMind {
        require(msg.sender == MasterMindAddr, "Denied operation.");
        _;
    }

    /// @notice checks that the function is originally invoked by the codemaker
    modifier codeMakerTurn {
        require(tx.origin == codeMaker, "Denied operation.");
        _;
    }

    /// @notice checks that the function is originally invoked by the codebreaker
    modifier codeBreakerTurn {
        require(tx.origin == codeBreaker, "Denied operation.");
        _;
    }

    /// @notice checks that the functions is called in the correct phase
    modifier checkPhase(Phase _phase) {
        require(phase == _phase, "Operation not allowed now.");
        _;
    }

    function getCodeMaker() external calledByMasterMind view 
        returns (address) { return codeMaker; }

    function getCodeBreaker() external calledByMasterMind view 
        returns (address) { return codeBreaker; }

    /// @notice after set the codebreaker, updates the phase of the game
    function setCodeBreaker(address  _codeBreaker) 
        calledByMasterMind checkPhase(Phase.Creation) external {
        codeBreaker = _codeBreaker;
        phase = Phase.Declaration;
    }

    function howManyPayed() external view returns (uint256) { return payedBy.length; }

    /// @notice getter for stake, but it reset the value to avoid possible reentrancy oversight
    function popStake() external returns (uint256) { 
        uint256 tmp = stake;
        delete stake;
        return tmp; 
    }

    function whoPayed() external view returns (address) { 
        require(payedBy.length > 0, "Nobody paid.");
        return payedBy[0]; 
    }

    /**
     * @notice shuffle the roles (codemaker/codebreaker) of the id-th game
     *  when the game is created, the creator is codeMaker and the challenger is codeBreaker,
     *  just to optimize variables (=> gas!). This function probabilistically revert them.
     *  In the end, it updates the phase of the game
     * @custom:revert if not called by mastermind or 
     *                if the stakes put by the two players doesn't coincide or
     *                if invoked while in another phase
     */
    function shuffleRoles() external
        calledByMasterMind checkPhase(Phase.Preparation) {
        require(payedBy.length == 2, "Both the player must put stake to start the game.");
        if (rand() % 2 == 0)
            (codeMaker, codeBreaker) = (codeBreaker, codeMaker);

        phase = Phase.SecretCode;
    }

    /**
     * @notice allow the players to declare the stake
     * @param _stake: stake that they agreed on off-chain
     * @return false if the stakes declared by the two players don't coincide
     *         true otherwise
     * @custom:revert if _stake == 0 or 
     *                if a player attempts to declare more than one time the stake or 
     *                if this tx is not invoked by the mastermind contract or 
     *                if this tx is sent while in another phase
     */
    function declareStake(uint256 _stake) external
        calledByMasterMind checkPhase(Phase.Declaration) returns (bool) {
        require(_stake > 0, "Stake must be greater than zero.");
        require(
            declaredBy.length == 0 || (declaredBy.length == 1 && declaredBy[0] != tx.origin),
            "You already declared stake."
        );

        if (declaredBy.length == 1 && stake != _stake) 
            return false;

        stake = _stake;
        declaredBy.push(tx.origin);

        if (declaredBy.length == 2)
            phase = Phase.Preparation;

        return true;
    }

    /**
     * @notice get player' stakes; 
     *         if the players put different stake values, the last transaction is reverted
     *         while the first one is refunded.
     * @return  false if the put stake is different from what was declared,
     *          true otherwise
     * @custom:revert if _stake == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if not invoked by mastermind or
     *                if invoked while in another phase
     */
    function setStake(uint256 _stake) external
        calledByMasterMind checkPhase(Phase.Preparation) returns (bool) {
        require(_stake > 0, "Stake must be greater than zero.");
        require(
            payedBy.length == 0 || (payedBy.length == 1 && payedBy[0] != tx.origin),
            "Cannot put money again."
        );

        if (stake != _stake) 
            return false;

        payedBy.push(tx.origin);
        return true;
    }

    /**
     * @param _hash: hash of a secret code, computed off-chain. Then update the phase.
     * @custom:revert if not invoked by MasterMind or 
     *                if not sent by the codeMaker or
     *                if invoked while in another phase
     */
    function setHash(bytes32 _hash) external
        calledByMasterMind codeMakerTurn checkPhase(Phase.SecretCode) {
        hash = _hash;
        phase = Phase.Guess;
    }

    /**
     * @notice allow the codebreaker to send a guess, then update the phase.
     * @param _guess: proposed secret code
     * @custom:revert if not invoked by MasterMind or 
     *                if not sent by the codebreaker or
     *                if invoked while in another phase or
     *                if already reached max number of guesses
     */
    function pushGuess(Color[N_HOLES] calldata _guess) external
        calledByMasterMind codeBreakerTurn checkPhase(Phase.Guess) {
        require(n_guess < N_GUESSES, "Max number of guesses reached.");
        guesses[turn][n_guess++] = _guess;
        phase = n_guess < N_GUESSES ? Phase.Feedback : Phase.Solution;
    }

    /**
     * @notice allow the codemaker to send a feedback about the last guess, then update the phase.
     * @param CC: number of colors belonging to the last guess in the correct position
     * @param NC: number of colors belonging to the last guess, but not in the correct positions
     * @custom:revert if not invoked by MasterMind or 
     *                if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if already reached max number of feedbacks
     */
    function pushFeedback(uint8 CC, uint8 NC) external
        calledByMasterMind codeMakerTurn checkPhase(Phase.Feedback){
        feedbacks[turn][n_guess-1][0] = CC;
        feedbacks[turn][n_guess-1][1] = NC;
        phase = CC < N_HOLES ? Phase.Guess : Phase.Solution;
    }

    /**
     * @notice codemaker submit solution <code, salt>. 
     *         Then update the phase and starts timer for dispute.
     * @param code: secret code he choose at the beginning
     * @param salt: numeric code to improve robustness
     * @custom:revert if not invoked by MasterMind or 
     *                if not sent by the codemaker or
     *                if invoked while in another phase or
     *                if the solution doesn't match the hash he choose at the beginning
     */
    function reveal(Color[N_HOLES] memory code, uint8[SALT_SZ] memory salt) external 
        calledByMasterMind codeMakerTurn checkPhase(Phase.Solution) {
        require(hashOf(code, salt) == hash, "Invalid Solution.");
        solution = code;
        dispute_block = block.number;
        phase = Phase.Dispute;
    }

    /**
     * @notice verify the correctness of a disputed feedback
     * @param feedback: the id of the disputed feedback
     * @return true if the given feedback is correct, false otherwise
     * @custom:revert if not invoked by MasterMind or 
     *                if not sent by the codebreaker or
     *                if invoked while in another phase or
     *                if the tx has been sent after the slot closes
     */
    function correctFeedback(uint8 feedback) view external
        calledByMasterMind codeBreakerTurn checkPhase(Phase.Dispute) returns (bool) {
        require(block.number <= dispute_block + (DISPUTE_TIME / BLOCK_SPAWN_RATE), "Time Over.");
        
        uint8 CC_count = 0; uint8 NC_count = 0;
        (uint8 CC, uint8 NC) = (feedbacks[turn][feedback][0], feedbacks[turn][feedback][1]);
        bool[N_HOLES] memory used_in_solution;
        bool[N_HOLES] memory used_in_guess;

        // correct positions for correct colors
        for (uint8 i = 0; i < N_HOLES; i++) {
            if (guesses[turn][feedback][i] == solution[i]) {
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

                if (solution[j] == guesses[turn][feedback][i]) {
                    NC_count++;
                    used_in_solution[j] = true;
                    break;
                }
            }
        }
        
        return (CC == CC_count && NC == NC_count);
    }

    function getPoints() external
        calledByMasterMind codeMakerTurn checkPhase(Phase.Dispute) returns (uint8, uint8){
        require(block.number >= dispute_block + (DISPUTE_TIME / BLOCK_SPAWN_RATE), "Time not Over yet.");

        points[codeMaker] += 
            n_guess + (equalCodes(guesses[turn][n_guess-1], solution) ? EXTRA_POINTS : 0);
        
        n_guess = 0;
        turn++;
        (codeMaker, codeBreaker) = (codeBreaker, codeMaker);
        phase = turn == N_TURNS ? Phase.Closing : Phase.SecretCode;
        
        return (points[codeMaker], turn);
    }

    function whoWin() external view calledByMasterMind checkPhase(Phase.Closing) returns(address){
        return  points[codeMaker] == points[codeBreaker] ? address(0) :
                points[codeMaker] > points[codeBreaker] ? codeMaker : codeBreaker;
    }

}