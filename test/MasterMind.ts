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

  it("New Game", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract.newGame())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1).newGame())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

  });

  it("Game joined by the same player - revert", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract.newGame())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by the onwer himself
    await expect(contract.newGame()).to.be.revertedWith("The player is already registered for a game.");

  });

  it("Game created by a player already registered - revert", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract.newGame())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by someone else
    await expect(contract.connect(addr1).newGame())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // the owner creates another game
    await expect(contract.newGame()).to.be.revertedWith("The player is already registered for a game.");

  });

  it("New Games - 3 players", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);  

    // game created by the owner of the contract
    await expect(contract.newGame())
      .to.emit(contract, "GameCreated")
      .withArgs(owner.address, 0);

    // game joined by another user
    await expect(contract.connect(addr1).newGame())
      .to.emit(contract, "GameJoined")
      .withArgs(addr1.address, 0);

    // game created by the owner of the contract
    await expect(contract.connect(addr2).newGame())
      .to.emit(contract, "GameCreated")
      .withArgs(addr2.address, 1);

  });

});