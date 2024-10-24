//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

event GameCreated(address _who, uint256 id);
event GameJoined(address _who, uint256 id);
event StakePut(address _who, uint256 _stake);
event Shuffled(address _codemaker, address _codebreaker);