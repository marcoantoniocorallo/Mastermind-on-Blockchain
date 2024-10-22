//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";

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
    bytes32[] private hash;         // computed off-chain
    uint8[] private guesses;
    uint8[] private feedbacks;

    constructor(address _contract, uint256 _id, address _codeMaker, address _codeBreaker){
        (MasterMindAddr,    id,     codeMaker,  codeBreaker) = 
        (_contract,         _id,    _codeMaker, _codeBreaker);
    }

    ///@notice checks that the function is invoked legally by the MasterMind contract
    modifier calledByMasterMind {
        require(msg.sender == MasterMindAddr, "Denied operation.");
        _;
    }

    function getCodeMaker() calledByMasterMind external view 
        returns (address) { return codeMaker; }

    function getCodeBreaker() calledByMasterMind external view 
        returns (address) { return codeBreaker; }

    function setCodeBreaker(address _codeBreaker) calledByMasterMind external {
        codeBreaker = _codeBreaker;
    }

    /**
     * @notice shuffle the roles (codemaker/codebreaker) of the id-th game
     *  when the game is created, the creator is codeMaker and the challenger is codeBreaker,
     *  just to optimize variables (=> gas!). This function probabilistically revert them.
     */
    function shuffleRoles() private {
        if (rand() % 2 == 0)
            (codeMaker, codeBreaker) = (codeBreaker, codeMaker);
    }

    /**
     * @param _stake: stake that the two players agree on off-chain
     */
    function setStake(uint256 _stake) private {
        // TODO: payable
        stake = _stake;
    }

    /**
     * @param _hash: hash of a secret code, computed off-chain
     */
    function setHash(bytes32[] calldata _hash) private {
        hash = _hash;
    }

}