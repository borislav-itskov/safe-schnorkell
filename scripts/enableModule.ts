import Safe from "@safe-global/protocol-kit";
require("dotenv").config();

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const safeAddress = process.env.SAFE_ADDR;
  if (!rpcUrl) throw new Error("rpc not set in env");
  if (!signerPrivateKey) throw new Error("signer private key not set in env");
  if (!safeAddress) throw new Error("safe address key not set in env");

  const protocolKitOwner = await Safe.init({
    provider: rpcUrl,
    signer: signerPrivateKey,
    safeAddress,
  });
  const moduleTxn = await protocolKitOwner.createEnableModuleTx(
    process.env.MODULE_ADDR!
  );
  const executeTxResponse = await protocolKitOwner.executeTransaction(
    moduleTxn
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
