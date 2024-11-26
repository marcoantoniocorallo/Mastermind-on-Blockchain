//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

import "./Constants.sol";

event GameCreated(address indexed who, uint256 indexed id);
event GameJoined(address indexed who, uint256 indexed id);
event StakeDeclared(uint256 indexed id, address who, uint256 _stake);
event StakePut(uint256 indexed id, address who, uint256 _stake);
event Shuffled(uint256 indexed id, address _codemaker, address _codebreaker);
event Transfered(uint256 indexed id, address who, uint256 howmuch);
event Punished(uint256 indexed id, address who);
event SecretCodeSent(uint256 indexed id, address who);
event GuessSent(uint256 indexed id, address who, Color[N_HOLES] code);
event FeedbackSent(uint256 indexed id, address who, uint8 CC, uint8 NC);
event SolutionSubmitted(uint256 indexed id, Color[N_HOLES] code, uint8[SALT_SZ] salt);
event Dispute(uint256 indexed id, uint8 feedback_id);
event PointsUpdated(uint256 indexed id, uint8 points);
event Winning(uint256 indexed id, address player);
event Tie(uint256 indexed id);
event AFKStart(uint256 indexed id, address who);
event AFKStop(uint256 indexed id);
event GameClosed(uint256 indexed id);
event GameLeft(uint256 indexed id, address who);