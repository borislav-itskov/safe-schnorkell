import { ethers } from "hardhat";

import { _generateSchnorrAddr } from "@borislav.itskov/schnorrkel.js/dist/core";
import { expect } from "chai";
import { SchnorrSigner } from "@borislav.itskov/schnorrkel.js";
import { hashMessage } from "ethers";
import { pk1 } from "./config";
require("dotenv").config();

describe("Schnorr tests", () => {
  it("successfully validate a basic schnorr signature", async () => {
    const signer = new SchnorrSigner(pk1);
    const schnorrModule = await ethers.deployContract("SafeSchnorr", [
      process.env.SAFE_ADDR!,
      signer.getSchnorrAddress(),
    ]);

    // sign
    const msg = "just a test message";
    const commitment = hashMessage(msg);
    const sig = signer.sign(commitment);
    const result = await schnorrModule.ecrecoverSchnorr(
      commitment,
      signer.getEcrecoverSignature(sig)
    );
    expect(signer.getSchnorrAddress()).to.equal(result);
  });
  it("fails because a different message was passed", async () => {
    const signer = new SchnorrSigner(pk1);
    const schnorrModule = await ethers.deployContract("SafeSchnorr", [
      process.env.SAFE_ADDR!,
      signer.getSchnorrAddress(),
    ]);

    // sign
    const msg = "just a test message";
    const msgHash = hashMessage(msg);
    const sig = signer.sign(msgHash);

    // validate
    const wrongMsg = "something else";
    const wrongMsgHash = hashMessage(wrongMsg);
    await expect(
      schnorrModule.ecrecoverSchnorr(
        wrongMsgHash,
        signer.getEcrecoverSignature(sig)
      )
    ).to.be.revertedWith("SV_SCHNORR_FAILED");
  });
});
