// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require("dotenv").config();
import { SchnorrSigner } from "@borislav.itskov/schnorrkel.js";

const DeploySafeSchnorr = buildModule("DeploySafeSchnorr", (m) => {
  const schnorrSigner = new SchnorrSigner(process.env.SIGNER_PRIVATE_KEY!);
  const safe = m.getParameter("safe", process.env.SAFE_ADDR!);
  const signer = m.getParameter("signer", schnorrSigner.getSchnorrAddress());

  const safeSchnorr = m.contract("SafeSchnorr", [safe, signer]);
  return { safeSchnorr };
});

export default DeploySafeSchnorr;
