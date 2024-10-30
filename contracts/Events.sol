//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Constants.sol";

event GameCreated(address _who, uint256 id);
event GameJoined(address _who, uint256 id);
event StakeDeclared(uint256 id, address _who, uint256 _stake);
event StakePut(uint256 id, address _who, uint256 _stake);
event Shuffled(uint256 id, address _codemaker, address _codebreaker);
event Transfered(address _who, uint256 howmuch);
event Punished(address _who);
event SecretCodeSent(address _who);
event GuessSent(address _who);
event FeedbackSent(address _who);
event SolutionSubmitted(uint256 id, Color[N_HOLES] code, uint8[SALT_SZ] salt);
event Dispute(uint256 game_id, uint8 feedback_id);
event PointsUpdated(uint256 game_id, uint8 points);
event Winning(uint256 game_id, address player);
event Tie(uint256 game_id);
event AFKStart(uint256 game_id, address _who);
event GameClosed(uint256 id);