import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-coverage';
import "hardhat-gas-reporter";
import { coinmarketcap_key, etherscan_key } from "./APIKey";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings:{
      optimizer: {
        enabled : true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    L1 : "ethereum",
    currency: 'EUR',
    L1Etherscan: etherscan_key,
    coinmarketcap: coinmarketcap_key,
  }
};

export default config;