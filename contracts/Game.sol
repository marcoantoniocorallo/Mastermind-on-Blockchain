//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";
import "./Constants.sol";
import "hardhat/console.sol";

/**
 * @title Game
 * @author Marco Antonio Corallo
 * @notice Contract of a single game
 */
contract Game{
    uint256 private id;
    address private MasterMindAddr; // stored to check against who sent the transaction
    address private codeMaker;      // initially it's the creator of the game
    address private codeBreaker;    // initially it's the challenger
    uint256 private stake;          // agreed off-chain
    address [] declaredBy;          // who already declared the stake?
    address [] payedBy;             // who already put the money?
    bytes32[] private hash;         // computed off-chain
    Phase phase;
    uint8[] private guesses;
    uint8[] private feedbacks;

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

    /// @notice checks that the functions is called in the correct phase
    modifier checkPhase(Phase _phase) {
        require(phase == _phase, "Operation not allowed now.");
        _;
    }

    /// @notice checks that the function is originally invoked by the codebreaker
    modifier codeBreakerTurn {
        require(tx.origin == codeMaker, "Denied operation.");
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
     *                if the stakes put by the two players doesn't coincide
     */
    function shuffleRoles() external
        calledByMasterMind checkPhase(Phase.Preparation) {
        require(payedBy.length == 2, "Both the player must put stake to start the game.");
        if (rand() % 2 == 0)
            (codeMaker, codeBreaker) = (codeBreaker, codeMaker);

        phase = Phase.SecretCode;
    }

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
     * @custom:revert if msg.value == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if not invoked by mastermind
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
     * @param _hash: hash of a secret code, computed off-chain
     * @custom:revert if not invoked by MasterMind or 
     *                if not originally sent by the codeMaker or 
     *                if the secret code has been already setted.
     * TODO: if the codemaker attempts to change the secret code after he choose it,
     *       the system may punish him.
     */
    function setHash(bytes32[] calldata _hash) external
        calledByMasterMind codeMakerTurn checkPhase(Phase.SecretCode) {
        require(hash.length == 0 ,"Secret Code already setted.");
        hash = _hash;
    }

}