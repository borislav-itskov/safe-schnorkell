import { SafeFactory } from "@safe-global/protocol-kit";
import { SafeAccountConfig } from "@safe-global/protocol-kit";
require("dotenv").config();

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC;
  const signerAddr = process.env.SIGNER_ADDR;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  if (!rpcUrl) throw new Error("rpc not set in env");
  if (!signerAddr) throw new Error("signer addr not set in env");
  if (!signerPrivateKey) throw new Error("signer private key not set in env");

  const safeFactory = await SafeFactory.init({
    provider: rpcUrl,
    signer: signerPrivateKey,
  });
  const safeAccountConfig: SafeAccountConfig = {
    owners: [signerAddr],
    threshold: 1,
  };
  const protocolKitOwner1 = await safeFactory.deploySafe({ safeAccountConfig });
  const safeAddress = await protocolKitOwner1.getAddress();

  console.log("Your Safe has been deployed:");
  console.log(safeAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
