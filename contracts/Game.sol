//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Utils.sol";

contract Game{
    address private MasterMindAddr;
    address private codeMaker;
    address private codeBreaker;
    bool private pending;
    uint256 private stake;
    bytes32[] private hash;
    uint8[] private guesses;
    uint8[] private feedbacks;

    constructor(address _contract, address _codeMaker, address _codeBreaker){
        (MasterMindAddr,  codeMaker,  codeBreaker,    pending) = 
        (_contract,     _codeMaker, _codeBreaker,   true);
    }

    function getCodeMaker() external view returns (address) { return codeMaker; }

    function getCodeBreaker() external view returns (address) { return codeBreaker; }

    function isPending() external view returns (bool) { return pending; }

    function setCodeBreaker(address _codeBreaker) external {
        require(msg.sender == MasterMindAddr, "Denied operation.");
        codeBreaker = _codeBreaker;
    }

    function setPending() external {
        require(msg.sender == MasterMindAddr, "Denied operation.");
        pending = false;
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
     * @param _stake: stake, agreed off-chain between the two players
     */
    function setStake(uint256 _stake) private {
        // probabilmente dovremo inserire una serie di controlli: stake minimo?
        // msg.sender è giocatore della partita id? 
        // Come controllare che l'altro giocatore sia d'accordo?
        stake = _stake;
    }

    /**
     * @param _hash: hash of a secret code, computed off-chain
     */
    function setHash(bytes32[] calldata _hash) private {
        hash = _hash;
    }

}