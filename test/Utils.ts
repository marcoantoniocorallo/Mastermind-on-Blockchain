import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
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

export const N_TURNS = 4;

export function compute_gas(gas_cost : bigint[]) : bigint {
    return gas_cost.reduce((partialSum : bigint, a : bigint) => partialSum + a, 0n);    
}

export function expect_eq(balance1 : bigint, balance2 : bigint) : Chai.Assertion {
    return expect(balance1).to.equal(ethers.parseUnits(balance2.toString(), 0));
}

export function hash(code : number[], salt : number[]) : string {
    // Concatenate enums and salt as bytes
    const data = Uint8Array.from([...code, ...salt]);

    // Hash the raw byte data
    // note: solidityPackedKeccak256 will be deprecated
    return ethers.keccak256(data);
}

export function toNum(code : Color[]) : number[] { 
    return code.map( (x : Color) =>  (x.valueOf() ));
}

export enum Color{
    Red, 
    Blue,
    Yellow,
    Green,
    Black,
    White
}

export async function delay(n_blocks : number) { 
    await ethers.provider.send("evm_setAutomine", [false]);
    for (let i = 0; i < n_blocks; i++) {
        await ethers.provider.send("evm_mine", []);
    }
    await ethers.provider.send("evm_setAutomine", [true]);
}

export const DELAY_TIME = 12 * 38;