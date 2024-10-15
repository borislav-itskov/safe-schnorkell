import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC,
      accounts: [process.env.SIGNER_PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASE_SEPOLIA_ETHERSCAN_API_KEY!,
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;
