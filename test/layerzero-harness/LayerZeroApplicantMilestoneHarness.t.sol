// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// The test contract remains in its canonical file. This isolated entry point
// lets Foundry compile the third-party LayerZero helper with Solidity 0.8.29
// without pulling exact-0.8.23 production artifacts into the same compiler run.
import {CurrentMainnetApplicantMilestoneBridgeTest} from "../CurrentMainnetApplicantMilestoneBridges.t.sol";
