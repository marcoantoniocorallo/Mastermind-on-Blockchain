import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-coverage';
import "hardhat-gas-reporter"; 
import "@primitivefi/hardhat-dodoc";

import { vars } from "hardhat/config";

const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");
const INFURA_API_KEY = vars.get("INFURA_KEY");
const EHTERSCAN_KEY = vars.get("ETHERSCAN_KEY");
const COINMARKETCAP_KEY = vars.get("COINMARKETCAP_KEY");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "TRUE", // Simplified enabled flag
    L1: "ethereum",
    currency: 'EUR',
    L1Etherscan: EHTERSCAN_KEY,
    coinmarketcap: COINMARKETCAP_KEY,
    excludeContracts: ["GameLib"]
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    hardhat: {
      chainId: 31337, // Chain ID for Hardhat network
      mining: {
        auto: true,
        interval: [11000, 13000]
      },
    }
  }
};

export default config;