//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

struct Game{
    address codeMaker;
    address codeBreaker;
    bool pending;
    uint256 stake;
} 