import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { bigint, string } from "hardhat/internal/core/params/argumentTypes";
import { deployFixture } from "./Fixtures";
import { compute_gas } from "./Utils";
import exp from "constants";

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

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

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

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

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

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

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

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    await expect(contract.connect(addr1).declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(addr1, 1);

    await expect(contract.declareStake(0, 2))
      .to.be.revertedWith("Operation not allowed now.");

  });

  /*
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

    let value = ethers.parseUnits("1", "wei");
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

    let value = ethers.parseUnits("1", "wei");

    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

    await expect(contract.connect(owner).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Operation not allowed now.");

  });

  it("Test10 : Different stake are sent - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    let value1 = ethers.parseUnits("1", "wei");
    let value2 = ethers.parseUnits("2", "wei");

    await expect(contract.prepareGame(0, { value: value1 } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    await expect(contract.connect(addr1).prepareGame(0, { value: value2 } ) )
      .to.be.revertedWith("The two stakes not coincide.");

  });

  it("Test11 : 0 stake - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    let value = ethers.parseUnits("0", "wei");

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.be.revertedWith("Stake must be greater than zero.");

  });

  it("Test12 : Single stake - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let gas_cost = [];

    let balance0 = await ethers.provider.getBalance(owner);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    // game created by the owner of the contract
    let receipt_newgame = await (await contract["newGame()"]()).wait();
    gas_cost.push(receipt_newgame.gasUsed * receipt_newgame.gasPrice);

    await contract.connect(addr1)["joinGame()"]();

    let value = ethers.parseUnits("1", "wei");
    
    let receipt_preparegame = await (await contract.prepareGame(0, { value: value } )).wait();
    gas_cost.push(receipt_preparegame.gasUsed * receipt_preparegame.gasPrice);

    let balance1 = await ethers.provider.getBalance(owner);
    let contract_balance1 = await ethers.provider.getBalance(contract);

    expect(Number(balance1)).to.be.equal(Number(balance0 - (compute_gas(gas_cost) + 1n)));
    expect(Number(contract_balance1)).to.be.equal(Number(contract_balance0 + 1n));

  });

  it("Test13 : Same stakes - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let owner_gas_cost = [];
    let addr1_gas_cost = [];

    let owner_balance0 = await ethers.provider.getBalance(owner);
    let addr1_balance0 = await ethers.provider.getBalance(addr1);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
    owner_gas_cost.push(owner_receipt_newgame.gasUsed * owner_receipt_newgame.gasPrice);

    let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
    addr1_gas_cost.push(addr1_receipt_newgame.gasUsed * addr1_receipt_newgame.gasPrice);

    let value = ethers.parseUnits("1", "wei");
    
    let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value } )).wait();
    owner_gas_cost.push(owner_receipt_preparegame.gasUsed * owner_receipt_preparegame.gasPrice);

    let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value } )).wait();
    addr1_gas_cost.push(addr1_receipt_preparegame.gasUsed * addr1_receipt_preparegame.gasPrice);

    let owner_balance1 = await ethers.provider.getBalance(owner);
    let addr1_balance1 = await ethers.provider.getBalance(addr1);
    let contract_balance1 = await ethers.provider.getBalance(contract);

    expect(Number(owner_balance1)).to.be.equal(Number(owner_balance0 - (compute_gas(owner_gas_cost) + 1n ) ) );
    expect(Number(addr1_balance1)).to.be.equal(Number(addr1_balance0 - (compute_gas(addr1_gas_cost) + 1n ) ) );
    expect(Number(contract_balance1)).to.be.equal(Number(contract_balance0 + 2n));

  });

  it("Test14 : Different stakes - revert - check balances", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  
    let owner_gas_cost = [];
    let addr1_gas_cost = [];

    let owner_balance0 = await ethers.provider.getBalance(owner);
    let addr1_balance0 = await ethers.provider.getBalance(addr1);
    let contract_balance0 = await ethers.provider.getBalance(contract);

    // game created by the owner of the contract
    let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
    owner_gas_cost.push(owner_receipt_newgame.gasUsed * owner_receipt_newgame.gasPrice);

    let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
    addr1_gas_cost.push(addr1_receipt_newgame.gasUsed * addr1_receipt_newgame.gasPrice);

    let value1 = ethers.parseUnits("1", "wei");
    let value2 = ethers.parseUnits("2", "wei");
    
    // to be refunded
    let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value1 } )).wait();
    owner_gas_cost.push(owner_receipt_preparegame.gasUsed * owner_receipt_preparegame.gasPrice);

    let contract_balance1 = await ethers.provider.getBalance(contract);
    expect(Number(contract_balance1)).to.be.equal(1);

    // reverted
    await expect(contract.connect(addr1).prepareGame(0, { value: value2 } ))
      .to.be.revertedWith("The two stakes not coincide.");

    let owner_balance1 = await ethers.provider.getBalance(owner);
    let addr1_balance1 = await ethers.provider.getBalance(addr1);
    let contract_balance2 = await ethers.provider.getBalance(contract);

    // only gas cost is subtracted by the user balances
    expect(Number(owner_balance1)).to.be.equal(Number(owner_balance0 - (compute_gas(owner_gas_cost))));
    // expect(Number(addr1_balance1)).to.be.equal(Number(addr1_balance0 - (compute_gas(addr1_gas_cost))));

    // still zero
    expect(Number(contract_balance2)).to.be.equal(Number(contract_balance0));

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

    let value = ethers.parseUnits("1", "wei");

    await expect(contract.prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(owner.address, 1)

    await expect(contract.connect(addr1).prepareGame(0, { value: value } ) )
      .to.emit(contract, "StakePut")
      .withArgs(addr1.address, 1)
      .and.to.emit(contract, "Shuffled");

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

    await expect(contract.declareStake(0, 1))
      .to.emit(contract, "StakeDeclared")
      .withArgs(owner, 1);

    await expect(contract.declareStake(0, 1))
      .to.be.revertedWith("You already declared stake.");

  });

  */
});