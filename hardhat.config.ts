import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-coverage';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings:{
      optimizer: {
        enabled : true,
        runs: 1000
      }
    }
  }
};

export default config;