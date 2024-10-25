//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

event GameCreated(address _who, uint256 id);
event GameJoined(address _who, uint256 id);
event StakeDeclared(address _who, uint256 _stake);
event StakePut(address _who, uint256 _stake);
event Shuffled(address _codemaker, address _codebreaker);
event Transfered(address _who, uint256 howmuch);
event Punished(address _who);
event GameClosed(uint256 id);