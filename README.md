# safe-schnorkell

A module for enabling Schnorr signatures on a Safe account

## Installation

`npm i`
`cp .env.example .env`

#### Fill in the .env variables

The private key you're going to use to deploy the contracts. You will need funds on base sepolia.  
Also, this is going to be the signer of the safe account you're going to deploy from the scripts.  
SIGNER_PRIVATE_KEY=

The address of your private key  
SIGNER_ADDR=

self-explanatory:  
BASE_SEPOLIA_RPC=  
BASE_SEPOLIA_CHAIN_ID=

Api key from the base sepolia explorer: https://sepolia.basescan.org/
BASE_SEPOLIA_ETHERSCAN_API_KEY=

#### Deploy your Safe

`npx hardhat run ./scripts/deploySafe.ts`
Once deployed, please open your .env file and fill in the deployed safe addresses.  
SAFE_ADDR=  
It is advisable not to use your personal SAFE_ADDRESS here, this repo is for demo purposes.

#### Deploy Safe Schnorr module

`npx hardhat ignition deploy ignition/modules/DeploySafeSchnorr.ts --network base-sepolia --verify --reset`
Once deployed, please open your .env file and file in the safe schnorr module addresses.  
MODULE_ADDR=

#### Enable the module

`npx hardhat run ./scripts/enableModule.ts`

And we're done!

## Usage

In order to test it, manually transfer some base sepolia funds to the created SAFE_ADDR. You will need them to run the schnorrExecute script. You're using ~2000 wei per transaction so you don't need a lot.

After you're done, the below script will make paymets to `SIGNER_ADDR` and a hardcoded test address in the script:
`npx hardhat run ./scripts/schnorrExecute.ts`

A log of the transaction will appear if everything is successful. Open it in base sepolia etherscan and check it!

## Signing

The schnorr signatures for this demo are produced by using https://github.com/borislav-itskov/schnorrkel.js  
The library can be freely used for Schnorr
