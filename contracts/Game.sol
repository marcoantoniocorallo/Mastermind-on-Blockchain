//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

struct Game{
    bool pending;
    address codeMaker;
    address codeBreaker;
    uint256 stake;
} 