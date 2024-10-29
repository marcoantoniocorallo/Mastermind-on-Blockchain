import { ethers } from "hardhat";

// Fixture to deploy the contract and get first three signers
export async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const GameLibrary = await ethers.getContractFactory("GameLib");
    const gameLibrary = await GameLibrary.deploy();
    const lib_address = await gameLibrary.getAddress();

    const contractFactory = await ethers.getContractFactory('MasterMind', {
        libraries: {
          GameLib: lib_address
        },
    });

    const contract = await contractFactory.deploy();

    return { contract, owner, addr1, addr2 };
}