import {
  AbiCoder,
  Contract,
  getBytes,
  JsonRpcProvider,
  keccak256,
  Wallet,
} from "ethers";
require("dotenv").config();
import safeSchnorrJson from "../artifacts/contracts/SafeSchnorr.sol/SafeSchnorr.json";
import Schnorrkel from "@borislav.itskov/schnorrkel.js";
import SchnorrSigner from "../src/libs/SchnorrSigner";

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const signerTwoPrivateKey = process.env.SIGNER_TWO_PRIVATE_KEY;
  const singerAddr = process.env.SIGNER_ADDR;
  const safeAddress = process.env.SAFE_ADDR;
  const moduleAddr = process.env.MULTI_SIG_MODULE_ADDR;
  const baseSepoliaChainId = process.env.BASE_SEPOLIA_CHAIN_ID;
  if (!rpcUrl) throw new Error("rpc not set in env");
  if (!signerPrivateKey) throw new Error("signer private key not set in env");
  if (!safeAddress) throw new Error("safe address key not set in env");
  if (!moduleAddr)
    throw new Error(
      "MULTI_SIG_MODULE_ADDR should be set for module address in this example"
    );
  if (!baseSepoliaChainId) throw new Error("chain id not set in env");
  if (!singerAddr) throw new Error("signer address not set in env");
  if (!signerTwoPrivateKey)
    throw new Error(
      "You need an additional private key for signer two to explore this demo script"
    );

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(signerPrivateKey, provider);
  const schnorrModule = new Contract(moduleAddr, safeSchnorrJson.abi, wallet);
  const nonce = await schnorrModule.nonce();

  const abiCoder = new AbiCoder();
  const calls = [
    [singerAddr, 90n, "0x"],
    ["0xc1e7354c7d11d95BDa4adf2A3Fd8984E1ddE7aCc", 120n, "0x"],
  ];
  const commitment = keccak256(
    abiCoder.encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "tuple(address, uint256, bytes)[]",
      ],
      [safeAddress, moduleAddr, baseSepoliaChainId, nonce, calls]
    )
  );

  const schnorrSignerOne = new SchnorrSigner(signerPrivateKey);
  const schnorrSignerTwo = new SchnorrSigner(signerTwoPrivateKey);
  const publicKeys = [
    schnorrSignerOne.getPublicKey(),
    schnorrSignerTwo.getPublicKey(),
  ];
  const publicNonces = [
    schnorrSignerOne.getPublicNonces(),
    schnorrSignerTwo.getPublicNonces(),
  ];
  const { signature: sigOne, challenge: e } =
    schnorrSignerOne.mutliSignatureSign(commitment, publicKeys, publicNonces);
  const { signature: sigTwo } = schnorrSignerTwo.mutliSignatureSign(
    commitment,
    publicKeys,
    publicNonces
  );
  const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo]);

  // the multisig px and parity
  const combinedPublicKey = getBytes(
    Schnorrkel.getCombinedPublicKey(publicKeys).buffer
  );
  const px = combinedPublicKey.slice(1, 33);
  const parity = combinedPublicKey[0] - 2 + 27;

  // wrap the result
  const signature = abiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint8"],
    [px, e.buffer, sSummed.buffer, parity]
  );

  const res = await schnorrModule.execute(calls, signature);
  console.log(res);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
