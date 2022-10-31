import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

import "./tasks/claim.ts"
import "./tasks/stake.ts"
import "./tasks/unstake.ts"

dotenv.config();


const config: HardhatUserConfig = {
  solidity: "0.8.11",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
      enabled: true,
      url: process.env.Goerli_API_KEY as string,
      }
    },   
    gorilla: {     
      url: process.env.Goerli_API_KEY || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],   
    },
    sepolia: {
      url: process.env.Sepolia_API_KEY || "",
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.API_KEY
  }
  
};

export default config;