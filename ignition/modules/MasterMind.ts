import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Module = buildModule("MasterMind", (m) => {
  const gameLib = m.library("GameLib");
  const mastermind = m.contract("MasterMind", [], {
    libraries : {
      GameLib : gameLib,
    },
  });

  return { mastermind };
});

module.exports = Module;