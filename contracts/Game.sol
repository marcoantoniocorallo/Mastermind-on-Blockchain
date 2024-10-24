//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";
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
    address [] payedBy;             // who already put the money?
    bytes32[] private hash;         // computed off-chain
    uint8[] private guesses;
    uint8[] private feedbacks;

    constructor(uint256 _id, address  _codeMaker, address  _codeBreaker){
        (MasterMindAddr,    id,     codeMaker,  codeBreaker) = 
        (msg.sender,       _id,    _codeMaker, _codeBreaker);
    }

    /// @notice checks that the function is invoked legally by the MasterMind contract
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
        require(tx.origin == codeMaker, "Denied operation.");
        _;
    }

    function getCodeMaker() calledByMasterMind external view 
        returns (address) { return codeMaker; }

    function getCodeBreaker() calledByMasterMind external view 
        returns (address) { return codeBreaker; }

    function setCodeBreaker(address  _codeBreaker) calledByMasterMind external {
        codeBreaker = _codeBreaker;
    }

    function howManyPayed() external view returns (uint256) { return payedBy.length; }

    function getStake() external view returns (uint256) { return stake; }

    function whoPayed() external view returns (address) { 
        require(payedBy.length > 0, "Nobody paid.");
        return payedBy[0]; 
    }

    /**
     * @notice shuffle the roles (codemaker/codebreaker) of the id-th game
     *  when the game is created, the creator is codeMaker and the challenger is codeBreaker,
     *  just to optimize variables (=> gas!). This function probabilistically revert them.
     * @custom:revert if not called by mastermind or 
     *                if the stakes put by the two players doesn't coincide
     */
    function shuffleRoles() calledByMasterMind external {
        require(payedBy.length == 2, "Both the player must put stake to start the game.");
        if (rand() % 2 == 0)
            (codeMaker, codeBreaker) = (codeBreaker, codeMaker);
    }

    /**
     * @notice get player' stakes; 
     *         if the players put different stake values, the last transaction is reverted
     *         while the first one is refunded.
     * @return number of players who put stake
     * @custom:revert if msg.value == 0 or 
     *                if more than 1 player already put money or 
     *                if a player attempts to put money more than one time or 
     *                if the two players put different stake values or 
     *                if not invoked by mastermind
     */
    function setStake(uint256 _stake) calledByMasterMind  external returns (uint256) {
        require(_stake > 0, "Stake must be greater than zero");
        require(
            payedBy.length == 0 || (payedBy.length == 1 && payedBy[0] != tx.origin),
            "Cannot put money again."
        );

        stake = _stake;
        payedBy.push((tx.origin));
    
        return payedBy.length;
    }

    /**
     * @param _hash: hash of a secret code, computed off-chain
     * @custom:revert if not invoked by MasterMind or 
     *                if not originally sent by the codeMaker or 
     *                if the secret code has been already setted.
     * TODO: if the codemaker attempts to change the secret code after he choose it,
     *       the system may punish him.
     */
    function setHash(bytes32[] calldata _hash) calledByMasterMind codeMakerTurn external {
        require(hash.length == 0 ,"Secret Code already setted.");
        hash = _hash;
    }

}