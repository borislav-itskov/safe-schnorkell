import Schnorrkel, {
  Key,
  PublicNonces,
  SignatureOutput,
} from "@borislav.itskov/schnorrkel.js";
import { _generateSchnorrAddr } from "@borislav.itskov/schnorrkel.js/dist/core";
import { getBytes, isHexString, SigningKey } from "ethers";

type Hex = string;

export default class SchnorrSigner {
  #privateKey: Key;
  #publicKey: Key;
  #schnorrkel: Schnorrkel;

  constructor(privateKey: Hex) {
    if (!isHexString(privateKey)) throw new Error("invalid hex for privateKey");

    this.#privateKey = new Key(Buffer.from(privateKey.substring(2), "hex"));
    this.#publicKey = new Key(
      Buffer.from(getBytes(SigningKey.computePublicKey(privateKey, true)))
    );
    this.#schnorrkel = new Schnorrkel();
  }

  getPublicKey(): Key {
    return this.#publicKey;
  }

  getSchnorrAddress() {
    return _generateSchnorrAddr(this.#publicKey.buffer);
  }

  getPublicNonces(): PublicNonces {
    return this.#schnorrkel.generatePublicNonces(this.#privateKey);
  }

  sign(commitment: string): SignatureOutput {
    return Schnorrkel.sign(this.#privateKey, commitment);
  }

  mutliSignatureSign(
    msg: string,
    publicKeys: Key[],
    publicNonces: PublicNonces[]
  ) {
    return this.#schnorrkel.multiSigSign(
      this.#privateKey,
      msg,
      publicKeys,
      publicNonces
    );
  }
}
