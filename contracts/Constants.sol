//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

uint8 constant N_HOLES = 4;                 // duplicate colors are allowed
uint8 constant N_GUESSES = 8;               // 8 guesses in a set
uint8 constant N_FEEDBACKS = N_GUESSES - 1; // reply to guesses
uint8 constant N_TURNS = 4;                 // number of sets in a game
uint8 constant SALT_SZ = 5;                 // size of the salt

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
    Dispute
}