import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";

export function compute_gas(gas_cost : bigint[]) : bigint {
    return gas_cost.reduce((partialSum : bigint, a : bigint) => partialSum + a, 0n);    
}

export function expect_eq(balance1 : bigint, balance2 : bigint) : Chai.Assertion {
    return expect(balance1).to.equal(ethers.parseUnits(balance2.toString(), 0));
}