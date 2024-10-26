import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployFixture } from "./Fixtures";
import { compute_gas, expect_eq, hash, Color } from "./Utils";

describe("Prepare game Tests", function () {

  it("Test1 : One stake is declared", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

  });

  it("Test2 : Stake declared too early - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test3 : Same stakes declared", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

  });

  it("Test4 : Different stakes declared - close game", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 2))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 2)
      .and.to.emit(contract, "GameClosed")
      .withArgs(0);

  });

  it("Test5 : Stakes declared two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare owner again
    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("You already declared stake.");

  });

  it("Test6 : Stakes declared two times and too late - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    // declare owner again
    await expect(contract.declareStake(0, 2))
      .to.be.revertedWith("Operation not allowed now.");

  });


  it("Test7 : One stake is sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);


    let value = ethers.parseUnits("1", "wei");

    // owner put money
    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)

  });

  it("Test8 : Stake put too early - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    let value = ethers.parseUnits("1", "wei");
    await expect(contract.connect(owner).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test9 : Stake put two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner pay
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    // addr1 pay
    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)
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
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    let value = ethers.parseUnits("0", "wei");

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Stake must be greater than zero.");

  });
  
  it("Test11 : Different stake are sent (same declared) -> close game with punishment", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    let value1 = ethers.parseUnits("1", "wei");
    let value2 = ethers.parseUnits("2", "wei");

    // owner pay 1
    await expect(contract.prepareGame(0, { value: value1 } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    // addr1 pay 2
    await expect(contract.connect(addr1).prepareGame(0, { value: value2 } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1, 2)
      .and.to.emit(contract, "Punished")
      .withArgs(addr1)
      .and.to.emit(contract, "Transfered")
      .withArgs(owner, 2)
      .and.to.emit(contract, "GameClosed")
      .withArgs(0);

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
      .withArgs(addr1, 1);

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

  it("Test14 : Different stakes - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let owner_gas_cost = [];
    let addr1_gas_cost = [];

    let owner_balance0 = await ethers.provider.getBalance(owner);
    let addr1_balance0 = await ethers.provider.getBalance(addr1);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    // game created by the owner of the contract
    let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
    owner_gas_cost.push(owner_receipt_newgame!.gasUsed * owner_receipt_newgame!.gasPrice);

    let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
    addr1_gas_cost.push(addr1_receipt_newgame!.gasUsed * addr1_receipt_newgame!.gasPrice);

    // declare owner
    let owner_receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
    owner_gas_cost.push(owner_receipt_declaregame!.gasUsed * owner_receipt_declaregame!.gasPrice);

    // declare addr1
    let addr1_receipt_declaregame = await (await contract.connect(addr1).declareStake(0, 1)).wait();
    addr1_gas_cost.push(addr1_receipt_declaregame!.gasUsed * addr1_receipt_declaregame!.gasPrice);

    let value1 = ethers.parseUnits("1", "wei");
    let value2 = ethers.parseUnits("2", "wei");
    
    // owner pays
    let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value1 } )).wait();
    owner_gas_cost.push(owner_receipt_preparegame!.gasUsed * owner_receipt_preparegame!.gasPrice);

    let contract_balance1 = await ethers.provider.getBalance(contract);
    expect_eq(contract_balance1, 1n);

    let owner_balance1 = await ethers.provider.getBalance(owner);
    expect_eq(owner_balance1, owner_balance0 - 1n - compute_gas(owner_gas_cost))

    // addr1 pays (different stake)
    let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value2 } )).wait();
    addr1_gas_cost.push(addr1_receipt_preparegame!.gasUsed * addr1_receipt_preparegame!.gasPrice);

    let addr1_balance1 = await ethers.provider.getBalance(addr1);
    expect_eq(addr1_balance1, addr1_balance0 - 2n - (compute_gas(addr1_gas_cost)));

    // owner refunded
    let owner_balance2 = await ethers.provider.getBalance(owner);
    expect_eq(owner_balance2, owner_balance0 + 2n - (compute_gas(owner_gas_cost)));

    // still zero
    let contract_balance2 = await ethers.provider.getBalance(contract);
    expect_eq(contract_balance2, contract_balance0);

  });

  it("Test15 : Same stake are sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

  });

  it("Test16 : Stakes declared two times - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test17 : Secret Code sent", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // declare owner
    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    // declare addr1
    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    let value = ethers.parseUnits("1", "wei");

    // owner send money
    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    // addr1 send money
    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

    const code = [Color.Red, Color.Red, Color.Yellow, Color.Green];
    const salt = [0, 0, 0, 0, 0];
    await expect(contract.sendCode(hash(code, salt), 0))
      .to.emit(contract, "SecretCodeSent")
      .withArgs(anyValue, hash(code, salt));
  });

});