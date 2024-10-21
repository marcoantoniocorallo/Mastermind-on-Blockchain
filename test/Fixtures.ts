import { ethers } from "hardhat";

// Fixture to deploy the contract and get first three signers
export async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const contract = await ethers.deployContract("MasterMind");

    return { contract, owner, addr1, addr2 };
}