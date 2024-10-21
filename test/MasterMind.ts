import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Game contract", function () {

  // Fixture to deploy the contract and get first three signers
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const contract = await ethers.deployContract("MasterMind");

    return { contract, owner, addr1, addr2 };
  }

  it("Test1 : Game created and joined", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

  });

  it("Test2 : Game joined by the same player - revert", async function () {
    const { contract, owner } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by the onwer himself
    await expect(contract["joinGame()"]())
      .to.be.revertedWith("The player is already registered for a game.");

  });
  
  it("Test3 : Two games created by the same player 1 - revert", async function () {
    const { contract, owner } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    await expect(contract["newGame()"]())
    .to.be.revertedWith("The player is already registered for a game.");

  });

  it("Test4 : Two games created by the same player 2 - revert", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by someone else
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // the owner creates another game
    await expect(contract["newGame()"]())
      .to.be.revertedWith("The player is already registered for a game.");

  });

  it("Test5 : New Games - 3 players", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1)["joinGame()"]())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // game created by the owner of the contract
    await expect(contract.connect(addr2)["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(addr2.address, 1);

  });

  it("Test6 : Game joined with id - 1", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame(address)"](addr2))
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr2)["joinGame(uint8)"](0))
      .to.emit(contract, "GameJoined")
      .withArgs(addr2.address, 0);

  });

  it("Test7 : Game joined with id - 2", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame()"]())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    await expect(contract.connect(addr1)["newGame(address)"](addr2))
      .to.emit(contract, "GameCreated")
      .withArgs(addr1.address, 1);


    // game joined by another user
    await expect(contract.connect(addr2)["joinGame(uint8)"](1))
      .to.emit(contract, "GameJoined")
      .withArgs(addr2.address, 1);

  });

  it("Test8 : Game joined by wrong id - revert", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame(address)"](addr1))
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr2)["joinGame(uint8)"](0))
      .to.be.revertedWith("You're not allowed to play this game.");
  });

  it("Test9 : create game with yourself - reverted", async function () {
    const { contract, owner } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract["newGame(address)"](owner))
      .to.be.revertedWith("Cannot create a game with yourself.");
  });

});