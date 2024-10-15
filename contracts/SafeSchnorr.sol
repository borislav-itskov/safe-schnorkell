// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ISafe} from "@safe-global/safe-smart-account/contracts/interfaces/ISafe.sol";

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

    /**
     * !!IMPORTANT!!
     * STORAGE SLOT 0, DO NOT CHANGE STORAGE SLOTS
     *
     * The module is going to be used only by delegations.
     * The nonce variable here should point to the nonce storage slot
     * of the iSafe(safe) address. That is slot 0
     */
    uint256 public nonce;

    constructor(ISafe _safe, address _signer) {
        signer = _signer;
        safe = _safe;
    }

    function validate(
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
        // only delegations from the safe address are allowed
        require(address(this) == address(safe), "NOT_A_DELEGATION");

        // IMPORTANT
        // since this is a delegation, the nonce variable actually points to the
        // storage slot of the ISafe(safe) - storage slot 0. That is the nonce
        // of the ISafe(safe). So we're incrementing the nonce of the ISafe
        uint256 currentNonce = nonce;
        nonce = currentNonce + 1;

        // the signature commitment hash
        // we reconstruct it here to allow only the currentNonce to be valid
        bytes32 commitment = keccak256(
            abi.encode(address(this), block.chainid, currentNonce, calls)
        );

        // validate reverts if the signature is invalid
        address retrievedSigner = validate(commitment, signature);
        require(retrievedSigner == signer, "INSUFFICIENT_PRIVILEGE");

        // execute the batch
        uint256 len = calls.length;
        for (uint256 i = 0; i < len; i++) {
            Call memory call = calls[i];
            if (call.to != address(0))
                executeCall(call.to, call.value, call.data);
        }
    }

    /**
     * @notice  Execute a signle transaction
     * @dev     we shouldn't use address.call(), cause: https://github.com/ethereum/solidity/issues/2884
     * @param   to  the address we're sending to
     * @param   value  the amount we're sending
     * @param   data  callData
     */
    function executeCall(
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        assembly {
            let result := call(
                gas(),
                to,
                value,
                add(data, 0x20),
                mload(data),
                0,
                0
            )

            if eq(result, 0) {
                let size := returndatasize()
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
    }
}
