// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeploySafeSchnorr = buildModule("DeploySafeSchnorr", (m) => {
  const safe = m.getParameter(
    "safe",
    "0x0000000000000000000000000000000000000000"
  );
  const signer = m.getParameter(
    "signer",
    "0x0000000000000000000000000000000000000000"
  );

  const safeSchnorr = m.contract("SafeSchnorr", [safe, signer]);
  return { safeSchnorr };
});

export default DeploySafeSchnorr;
