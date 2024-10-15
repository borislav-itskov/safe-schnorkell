// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";
require("dotenv").config();
import { _generateSchnorrAddr } from "@borislav.itskov/schnorrkel.js/dist/core";

function getSchnorrAddress() {
  const publicKey = Buffer.from(
    ethers.getBytes(
      ethers.SigningKey.computePublicKey(process.env.SIGNER_PRIVATE_KEY!, true)
    )
  );
  return _generateSchnorrAddr(publicKey);
}

const DeploySafeSchnorr = buildModule("DeploySafeSchnorr", (m) => {
  const safe = m.getParameter("safe", process.env.SAFE_ADDR!);
  const signer = m.getParameter("signer", getSchnorrAddress());

  const safeSchnorr = m.contract("SafeSchnorr", [safe, signer]);
  return { safeSchnorr };
});

export default DeploySafeSchnorr;
