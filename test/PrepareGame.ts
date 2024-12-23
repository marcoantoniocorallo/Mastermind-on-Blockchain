import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployFixture, compute_gas, expect_eq, hash, Color, delay, DELAY_TIME } from "./Utils";

describe("Prepare game Tests", function () {

  it("Test1 : One stake is declared", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

  });

  it("Test2 : Stake declared too early - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test3 : Same stakes declared", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

  });

  it("Test4 : Different stakes declared - close game", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 2))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 2)
      .and.to.emit(contract, "GameClosed")
      .withArgs(0);

    // game created by the owner of the contract
    await expect(contract.connect(owner)["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 1, ethers.ZeroAddress);

    // game created by addr1
    await expect(contract.connect(addr1)["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(addr1.address, 2, ethers.ZeroAddress);

  });

  it("Test5 : Stakes declared two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare owner again
    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("You already declared stake.");

  });

  it("Test6 : Stakes declared two times and too late - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    // declare owner again
    await expect(contract.declareStake(0, 2))
      .to.be.revertedWith("Operation not allowed now.");

  });


  it("Test7 : One stake is sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);


    let value = ethers.parseUnits("1", "wei");

    // owner put money
    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, addr1.address, 1)

  });

  it("Test8 : Stake put too early - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    let value = ethers.parseUnits("1", "wei");
    await expect(contract.connect(owner).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test9 : Stake put two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner pay
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 pay
    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

    // owner pay again
    await expect(contract.connect(owner).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test10 : 0 stake - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("0", "wei");

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Stake must be greater than zero.");

  });
  
  it("Test11 : Different stake are sent (same declared) -> revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value1 = ethers.parseUnits("1", "wei");
    let value2 = ethers.parseUnits("2", "wei");

    // owner pay 1
    await expect(contract.prepareGame(0, { value: value1 } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 pay 2
    await expect(contract.connect(addr1).prepareGame(0, { value: value2 } ) )
      .to.be.revertedWith("Wrong stake.");

  });

  it("Test12 : Single stake - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let gas_cost = [];

    let balance0 = await ethers.provider.getBalance(owner);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    // game created by the owner of the contract
    let receipt_newgame = await (await contract["newGame()"]()).wait();
    gas_cost.push(receipt_newgame!.gasUsed * receipt_newgame!.gasPrice);

    await contract.connect(addr1)["joinGame()"]();

    // declare owner
    let receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
    gas_cost.push(receipt_declaregame!.gasUsed * receipt_declaregame!.gasPrice);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");
    
    // owner put stake
    let receipt_preparegame = await (await contract.prepareGame(0, { value: value } )).wait();
    gas_cost.push(receipt_preparegame!.gasUsed * receipt_preparegame!.gasPrice);

    let balance1 = await ethers.provider.getBalance(owner);
    let contract_balance1 = await ethers.provider.getBalance(contract);

    expect_eq(balance1, balance0 - (compute_gas(gas_cost) + 1n));
    expect_eq(contract_balance1, contract_balance0 + 1n);
  });

  it("Test13 : Same stakes - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let owner_gas_cost = [];
    let addr1_gas_cost = [];

    let owner_balance0 = await ethers.provider.getBalance(owner);
    let addr1_balance0 = await ethers.provider.getBalance(addr1);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    // owner create a game
    let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
    owner_gas_cost.push(owner_receipt_newgame!.gasUsed * owner_receipt_newgame!.gasPrice);

    // addr1 join
    let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
    addr1_gas_cost.push(addr1_receipt_newgame!.gasUsed * addr1_receipt_newgame!.gasPrice);

    // declare owner
    let owner_receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
    owner_gas_cost.push(owner_receipt_declaregame!.gasUsed * owner_receipt_declaregame!.gasPrice);

    // declare addr1
    let addr1_receipt_declaregame = await (await contract.connect(addr1).declareStake(0, 1)).wait();
    addr1_gas_cost.push(addr1_receipt_declaregame!.gasUsed * addr1_receipt_declaregame!.gasPrice);

    let value = ethers.parseUnits("1", "wei");
    
    // owner pays
    let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value } )).wait();
    owner_gas_cost.push(owner_receipt_preparegame!.gasUsed * owner_receipt_preparegame!.gasPrice);

    // addr1 pays
    let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value } )).wait();
    addr1_gas_cost.push(addr1_receipt_preparegame!.gasUsed * addr1_receipt_preparegame!.gasPrice);

    let owner_balance1 = await ethers.provider.getBalance(owner);
    let addr1_balance1 = await ethers.provider.getBalance(addr1);
    let contract_balance1 = await ethers.provider.getBalance(contract);

    expect_eq(owner_balance1, owner_balance0 - (compute_gas(owner_gas_cost) + 1n ));
    expect_eq(addr1_balance1, addr1_balance0 - (compute_gas(addr1_gas_cost) + 1n ));
    expect_eq(contract_balance1, contract_balance0 + 2n);
  });

  it("Test15 : Same stake are sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

  });

  it("Test16 : Stakes declared two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test17 : Secret Code sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codemaker_addr : string = logs[logs.length-1].args[1];

    const codemaker = codemaker_addr === owner.address ? owner : addr1;

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
      .to.emit(contract, "SecretCodeSent");
  });

  it("Test18 : Secret Code sent by the codebreaker - revert ", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codebreaker_addr : string = logs[logs.length-1].args[2];

    const codebreaker = codebreaker_addr === owner.address ? owner : addr1;

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.connect(codebreaker).sendCode(hash(code, salt), 0))
      .to.be.revertedWith("Denied operation.")
  });

  it("Test19 : Secret Code sent too early - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.connect(owner).sendCode(hash(code, salt), 0))
      .to.be.revertedWith("Operation not allowed now.");
  });

  it("Test20 : Secret Code sent by a third user - revert ", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.connect(addr2).sendCode(hash(code, salt), 0))
      .to.be.revertedWith("Denied operation.")
  });

  it("Test21 : Secret Code sent two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codemaker_addr : string = logs[logs.length-1].args[1];

    const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
      .to.emit(contract, "SecretCodeSent");

    // re-send
    await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test22 : Game left by who put stake", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // game left by the owner of the contract
    await expect(contract.leaveGame(0))
      .to.emit(contract, "GameLeft")
      .withArgs(0, owner.address)
      .and.to.emit(contract, "GameClosed")
      .and.to.emit(contract, "Transfered")
      .withArgs(0, owner.address, 1);

  });

  it("Test23 : Game left after both put stake 1 ", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codemaker_addr : string = logs[logs.length-1].args[1];

    // game left by the owner of the contract
    await expect(contract.leaveGame(0))
      .to.emit(contract, "GameLeft")
      .withArgs(0, owner.address)
      .and.to.emit(contract, "GameClosed")
      .and.to.emit(contract, "Transfered")
      .withArgs(0, addr1.address, 2);

  });

  it("Test24 : Game left after both put stake 2 ", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codemaker_addr : string = logs[logs.length-1].args[1];

    // game left by the owner of the contract
    await expect(contract.connect(addr1).leaveGame(0))
      .to.emit(contract, "GameLeft")
      .withArgs(0, addr1.address)
      .and.to.emit(contract, "GameClosed")
      .and.to.emit(contract, "Transfered")
      .withArgs(0, owner.address, 2);

  });

  it("Test25 : Game left by not-allowed user ", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0, ethers.ZeroAddress);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(0, addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(0, owner.address, 1)

    // addr1 send money
    let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
    const logs : any =  receipt!.logs;
    const codemaker_addr : string = logs[logs.length-1].args[1];

    // game left by the owner of the contract
    await expect(contract.connect(addr2).leaveGame(0))
      .to.be.revertedWith("Denied operation.")

  });

});