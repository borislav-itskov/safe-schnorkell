// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ISafe} from "@safe-global/safe-smart-account/contracts/interfaces/ISafe.sol";
import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

contract SafeSchnorr {
    // secp256k1 group order
    uint256 internal constant Q =
        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    // the schnorr signer address
    address public immutable signer;

    // the safe address the module is enabled for
    ISafe public immutable safe;

    // Transaction structure
    // we handle replay protection separately by requiring (address(this), chainID, nonce) as part of the sig
    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    uint256 public nonce;

    constructor(ISafe _safe, address _signer) {
        signer = _signer;
        safe = _safe;
    }

    function ecrecoverSchnorr(
        bytes32 commitment,
        bytes calldata signature
    ) public pure returns (address) {
        // Based on https://hackmd.io/@nZ-twauPRISEa6G9zg3XRw/SyjJzSLt9
        // You can use this library to produce signatures: https://github.com/borislav-itskov/schnorrkel.js
        // px := public key x-coord
        // e := schnorr signature challenge
        // s := schnorr signature
        // parity := public key y-coord parity (27 or 28)
        // last uint8 is for the Ambire sig mode - it's ignored
        (bytes32 px, bytes32 e, bytes32 s, uint8 parity) = abi.decode(
            signature,
            (bytes32, bytes32, bytes32, uint8)
        );
        // ecrecover = (m, v, r, s);
        bytes32 sp = bytes32(Q - mulmod(uint256(s), uint256(px), Q));
        bytes32 ep = bytes32(Q - mulmod(uint256(e), uint256(px), Q));

        require(sp != bytes32(Q));
        // the ecrecover precompile implementation checks that the `r` and `s`
        // inputs are non-zero (in this case, `px` and `ep`), thus we don't need to
        // check if they're zero.
        address R = ecrecover(sp, parity, px, ep);
        require(R != address(0), "SV_ZERO_SIG");
        require(
            e == keccak256(abi.encodePacked(R, uint8(parity), px, commitment)),
            "SV_SCHNORR_FAILED"
        );
        return address(uint160(uint256(px)));
    }

    function execute(Call[] calldata calls, bytes calldata signature) external {
        // prevent reEntry
        uint256 currentNonce = nonce;
        nonce = currentNonce + 1;

        // prevent replays by reconstructing the hash with
        // safe addr, module addr, chainId and nonce
        bytes32 commitment = keccak256(
            abi.encode(
                address(safe),
                address(this),
                block.chainid,
                currentNonce,
                calls
            )
        );

        address retrievedSigner = ecrecoverSchnorr(commitment, signature);
        require(retrievedSigner == signer, "INSUFFICIENT_PRIVILEGE");

        // execute the batch
        uint256 len = calls.length;
        for (uint256 i = 0; i < len; i++) {
            Call memory call = calls[i];
            safe.execTransactionFromModule(
                call.to,
                call.value,
                call.data,
                // forbid delegate calls, too unpredictable
                Enum.Operation.Call
            );
        }
    }
}
