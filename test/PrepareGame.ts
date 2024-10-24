import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployFixture }from "./Fixtures"

describe("Prepare game Tests", function () {

  it("Test1 : One stake is sent", async function () {
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

  it("Test2 : Same stake are sent", async function () {
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

});