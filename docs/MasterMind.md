# MasterMind

*Marco Antonio Corallo*

> MasterMind

An implementation of MasterMind on Ethereum Blockchain



## Methods

### AFK

```solidity
function AFK(uint256 id) external nonpayable
```

sender put under accusation the opponent



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id |

### claimStakeByAFK

```solidity
function claimStakeByAFK(uint256 id) external nonpayable
```

transfer the stake to the player that accuse and win the AFK



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id  |

### declareStake

```solidity
function declareStake(uint256 id, uint256 stake) external nonpayable
```

set stake value. If the two players declare different values =&gt; close the game



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id |
| stake | uint256 | : stake declared by the sender |

### joinGame

```solidity
function joinGame() external nonpayable
```

Overload with no params: join a random game




### joinGame

```solidity
function joinGame(uint256 id) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : identifier of the game the challenger wants to join |

### leaveGame

```solidity
function leaveGame(uint256 id) external nonpayable
```

Allow a player to leave the game.          If the stake has already been put, the give-up player lose the game.



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id  |

### newGame

```solidity
function newGame() external nonpayable returns (uint256)
```

Overload with no params: create a new game without a specific challenger




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### newGame

```solidity
function newGame(address challenger_addr) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| challenger_addr | address | : address of the player the game creator wants to play with                         or address(0) |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | game&#39;s id |

### prepareGame

```solidity
function prepareGame(uint256 id) external payable
```

Allow players to put stake. When both the players put it, shuffle roles         If a player put a different stake from what was declared, the tx is reverted.



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id |

### sendCode

```solidity
function sendCode(bytes32 _hash, uint256 id) external nonpayable
```

allow a player to send the secret code



#### Parameters

| Name | Type | Description |
|---|---|---|
| _hash | bytes32 | : secret code, hashed and salted off-chain |
| id | uint256 | : game id  |

### sendFeedback

```solidity
function sendFeedback(uint8 CC, uint8 NC, uint256 id) external nonpayable
```

allow the codemaker to send a feedback about the last guess



#### Parameters

| Name | Type | Description |
|---|---|---|
| CC | uint8 | : number of colors belonging to the last guess in the correct position |
| NC | uint8 | : number of colors belonging to the last guess, but not in the correc: game id positions |
| id | uint256 | : game id |

### sendGuess

```solidity
function sendGuess(enum Color[4] code, uint256 id) external nonpayable
```

allow the codebreaker to send the secret code



#### Parameters

| Name | Type | Description |
|---|---|---|
| code | enum Color[4] | : proposed secret code |
| id | uint256 | : game id |

### startDispute

```solidity
function startDispute(uint256 id, uint8 feedback_id) external nonpayable
```

allow the codebreaker to start a dispute on a given feedback



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id  |
| feedback_id | uint8 | : reference to the disputed feedback |

### submitSolution

```solidity
function submitSolution(uint256 id, enum Color[4] code, uint8[5] salt) external nonpayable
```

allow the codemaker to reveal the solution &lt;code, salt&gt;. Starts dispute timer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id |
| code | enum Color[4] | : secret code he choose at the beginning |
| salt | uint8[5] | : numeric code to improve robustness |

### updateScore

```solidity
function updateScore(uint256 id) external nonpayable
```

after the dispute time update points and, if all turns have been played, draw winner 



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | : game id |



## Events

### AFKStart

```solidity
event AFKStart(uint256 indexed id, address who)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |

### AFKStop

```solidity
event AFKStop(uint256 indexed id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |

### Dispute

```solidity
event Dispute(uint256 indexed id, uint8 feedback_id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| feedback_id  | uint8 | undefined |

### FeedbackSent

```solidity
event FeedbackSent(uint256 indexed id, address who, uint8 CC, uint8 NC)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |
| CC  | uint8 | undefined |
| NC  | uint8 | undefined |

### GameClosed

```solidity
event GameClosed(uint256 indexed id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |

### GameCreated

```solidity
event GameCreated(address indexed who, uint256 indexed id, address indexed challenger)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| id `indexed` | uint256 | undefined |
| challenger `indexed` | address | undefined |

### GameJoined

```solidity
event GameJoined(address indexed who, uint256 indexed id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| id `indexed` | uint256 | undefined |

### GameLeft

```solidity
event GameLeft(uint256 indexed id, address who)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |

### GuessSent

```solidity
event GuessSent(uint256 indexed id, address who, enum Color[4] code)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |
| code  | enum Color[4] | undefined |

### PointsUpdated

```solidity
event PointsUpdated(uint256 indexed id, uint8 points)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| points  | uint8 | undefined |

### Punished

```solidity
event Punished(uint256 indexed id, address who)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |

### SecretCodeSent

```solidity
event SecretCodeSent(uint256 indexed id, address who)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |

### Shuffled

```solidity
event Shuffled(uint256 indexed id, address _codemaker, address _codebreaker)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| _codemaker  | address | undefined |
| _codebreaker  | address | undefined |

### SolutionSubmitted

```solidity
event SolutionSubmitted(uint256 indexed id, enum Color[4] code, uint8[5] salt)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| code  | enum Color[4] | undefined |
| salt  | uint8[5] | undefined |

### StakeDeclared

```solidity
event StakeDeclared(uint256 indexed id, address who, uint256 _stake)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |
| _stake  | uint256 | undefined |

### StakePut

```solidity
event StakePut(uint256 indexed id, address who, uint256 _stake)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |
| _stake  | uint256 | undefined |

### Tie

```solidity
event Tie(uint256 indexed id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |

### Transfered

```solidity
event Transfered(uint256 indexed id, address who, uint256 howmuch)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| who  | address | undefined |
| howmuch  | uint256 | undefined |

### Winning

```solidity
event Winning(uint256 indexed id, address player)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| player  | address | undefined |



