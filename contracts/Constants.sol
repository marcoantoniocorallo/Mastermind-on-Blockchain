//SPDX-License-Identifier: CC-BY-1.0
pragma solidity ^0.8.0;

uint8 constant MAX_GAMES = 255; // maximum number of games at the same time
uint8 constant N_COLORS = 6;    // we chose 4 colors in an umbrella of 6 colors
uint8 constant N_HOLES = 4;     // duplicate colors are allowed
uint8 constant N_GUESSES = 8;   // 8 guesses in a set
uint8 constant N_TURNS = 3;     // number of sets in a game