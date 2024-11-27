//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

uint8 constant N_HOLES = 4;                 // duplicate colors are allowed
uint8 constant N_GUESSES = 8;               // 8 guesses in a set
uint8 constant N_TURNS = 4;                 // number of sets in a game
uint8 constant SALT_SZ = 5;                 // size of the salt
uint8 constant DISPUTE_TIME = 36;           // 36 secs to start a dispute - multiple of 12
uint8 constant AFK_TIME = 36;               // 36 secs to accuse to be AFK - multiple of 12
uint8 constant BLOCK_SPAWN_RATE = 12;       // avg block time https://etherscan.io/chart/blocktime
uint8 constant EXTRA_POINTS = 3;

enum Color {
    Red,
    Blue,
    Yellow,
    Green,
    Black,
    White
}

enum Phase{
    Creation,
    Declaration,
    Preparation,
    SecretCode,
    Guess,
    Feedback,
    Solution,
    Dispute,
    Closing
}