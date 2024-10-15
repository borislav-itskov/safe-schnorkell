import Safe from "@safe-global/protocol-kit";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
require("dotenv").config();

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC;
  const signerAddr = process.env.SIGNER_ADDR;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const safeAddress = process.env.SAFE_ADDR;
  if (!rpcUrl) throw new Error("rpc not set in env");
  if (!signerAddr) throw new Error("signer addr not set in env");
  if (!signerPrivateKey) throw new Error("signer private key not set in env");
  if (!safeAddress) throw new Error("safe address key not set in env");

  const protocolKitOwner = await Safe.init({
    provider: rpcUrl,
    signer: signerPrivateKey,
    safeAddress,
  });
  const safeTransactionData: MetaTransactionData = {
    to: "0xb7E4F998792C1983e3379a91DbD14854649506E2",
    value: "100",
    data: "0x",
  };
  // Create a Safe transaction with the provided parameters
  const safeTransaction = await protocolKitOwner.createTransaction({
    transactions: [safeTransactionData],
  });
  const executeTxResponse = await protocolKitOwner.executeTransaction(
    safeTransaction
  );
  // @ts-ignore
  const receipt = await executeTxResponse.transactionResponse?.wait();

  console.log("Transaction executed:");
  console.log(receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
