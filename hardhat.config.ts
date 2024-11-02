import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-coverage';
import "hardhat-gas-reporter";

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
    L1Etherscan: vars.get("ETHERSCAN_KEY"),
    coinmarketcap: vars.get("COINMARKETCAP_KEY"),
    // gasPrice: by default fetched from live network
    gasPrice: 13,
    excludeContracts: ["GameLib"]
  }
};

export default config;