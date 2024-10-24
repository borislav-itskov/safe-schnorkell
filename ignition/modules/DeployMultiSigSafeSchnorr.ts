// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

require("dotenv").config();
import { _generateSchnorrAddr } from "@borislav.itskov/schnorrkel.js/dist/core";
import {
  SchnorrMultisigProvider,
  SchnorrSigner,
} from "@borislav.itskov/schnorrkel.js";

function getSchnorrAddress() {
  const schnorrSigner = new SchnorrSigner(process.env.SIGNER_PRIVATE_KEY!);
  const schnorrSignerTwo = new SchnorrSigner(
    process.env.SIGNER_TWO_PRIVATE_KEY!
  );
  const multisigProvider = new SchnorrMultisigProvider([
    schnorrSigner,
    schnorrSignerTwo,
  ]);
  return multisigProvider.getSchnorrAddress();
}

const DeploySafeSchnorr = buildModule("DeploySafeSchnorr", (m) => {
  const safe = m.getParameter("safe", process.env.SAFE_ADDR!);
  const signer = m.getParameter("signer", getSchnorrAddress());

  const safeSchnorr = m.contract("SafeSchnorr", [safe, signer]);
  return { safeSchnorr };
});

export default DeploySafeSchnorr;
