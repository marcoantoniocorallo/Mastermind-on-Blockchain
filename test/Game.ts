const { expect } = require("chai");
import { ethers } from "hardhat";

describe("Game contract", function () {
  it("Contract Deploy", async function () {
    const contract = await ethers.deployContract("Game");
    await contract.newGame();
  });

});