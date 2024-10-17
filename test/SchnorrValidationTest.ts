import { ethers } from "hardhat";

import { _generateSchnorrAddr } from "@borislav.itskov/schnorrkel.js/dist/core";
import { expect } from "chai";
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import {
  AbiCoder,
  getAddress,
  getBytes,
  hashMessage,
  SigningKey,
} from "ethers";
require("dotenv").config();

/**
 * Generate the multisig address that will have permissions to sign
 *
 * @returns address
 */
function getSchnorrAddress() {
  const publicKey = Buffer.from(
    getBytes(SigningKey.computePublicKey(process.env.SIGNER_PRIVATE_KEY!, true))
  );
  return getAddress(_generateSchnorrAddr(publicKey));
}

describe("Schnorr tests", () => {
  it("successfully validate a basic schnorr signature", async () => {
    const schnorrModule = await ethers.deployContract("SafeSchnorr", [
      process.env.SAFE_ADDR!,
      getSchnorrAddress(),
    ]);

    // sign
    const msg = "just a test message";
    const msgHash = hashMessage(msg);
    const privateKey = new Key(
      Buffer.from(getBytes(process.env.SIGNER_PRIVATE_KEY!))
    );
    const sig = Schnorrkel.sign(privateKey, msgHash);

    // wrap the result
    const publicKey = getBytes(
      SigningKey.computePublicKey(process.env.SIGNER_PRIVATE_KEY!, true)
    );
    const px = publicKey.slice(1, 33);
    const parity = publicKey[0] - 2 + 27;
    const abiCoder = new AbiCoder();
    const sigData = abiCoder.encode(
      ["bytes32", "bytes32", "bytes32", "uint8"],
      [px, sig.challenge.buffer, sig.signature.buffer, parity]
    );
    const result = await schnorrModule.ecrecoverSchnorr(msgHash, sigData);
    expect(getSchnorrAddress()).to.equal(result);
  });
});
