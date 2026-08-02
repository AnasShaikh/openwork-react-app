// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console2} from "forge-std/Script.sol";

import {ETHOpenworkDAO as ETHOpenworkDAOV3} from "../src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol";
import {ETHDAOMessaging} from "../src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol";
import {LocalLZOpenworkBridgeV2} from "../src/suites/current-mainnet/local/local-lz-openwork-bridge-v2.sol";
import {LocalOpenWorkJobContractLite as LocalOpenWorkJobContractLiteV3} from
    "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol";
import {NativeArbAthenaClientV3} from "../src/suites/current-mainnet/native/native-arb-athena-client-v3.sol";
import {NativeArbOpenWorkJobContractV5} from "../src/suites/current-mainnet/native/native-arb-lowjc-v5.sol";
import {NativeAthenaV9} from "../src/suites/current-mainnet/native/native-athena-v9.sol";
import {NativeDAOStakeSync} from "../src/suites/current-mainnet/native/native-dao-stake-sync-v1.sol";
import {NativeLZOpenworkBridgeV3} from "../src/suites/current-mainnet/native/native-lz-openwork-bridge-v3.sol";
import {NativeOpenworkDAO as NativeOpenworkDAOV2} from "../src/suites/current-mainnet/native/native-openwork-dao-v2.sol";
import {NativeOpenWorkJobContract as NativeOpenWorkJobContractV5} from
    "../src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol";
import {NativeProfileGenesis as NativeProfileGenesisV2} from
    "../src/suites/current-mainnet/native/native-profile-genesis-v2.sol";
import {NativeProfileManager as NativeProfileManagerV3} from
    "../src/suites/current-mainnet/native/native-profile-manager-v3.sol";
import {OpenworkVotingPowerCheckpoints} from
    "../src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol";
import {UUPSProxy} from "../src/suites/current-mainnet/utilities/proxy.sol";

/// @notice Deployment-only scripts for the confirmed July 2026 successor artifacts.
/// @dev These scripts deliberately do not upgrade, configure, or rewire any live contract.
///      Run without `--broadcast` for simulation. A live run remains approval-gated.
abstract contract ConfirmedUpgradeArtifacts19Jul2026 is Script {
    address internal constant EXPECTED_OWNER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;

    function _owner(string memory variableName) internal view returns (address owner) {
        owner = vm.envAddress(variableName);
        require(owner == EXPECTED_OWNER, "Unexpected release owner");
    }

    function _assertStartingNonce(address owner, string memory variableName) internal view {
        uint64 expectedNonce = uint64(vm.envUint(variableName));
        require(vm.getNonce(owner) == expectedNonce, "Release owner nonce changed");
    }
}

/// @dev Stable CREATE order from an owner nonce of 40:
///      DAO V3 implementation, checkpoints V1 implementation/proxy,
///      messaging V1 implementation/proxy.
contract DeployEthereumConfirmedUpgradeArtifacts19Jul2026 is ConfirmedUpgradeArtifacts19Jul2026 {
    address internal constant ETH_DAO_PROXY = 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294;
    address internal constant ETH_BRIDGE = 0x20Fa268106A3C532cF9F733005Ab48624105c42F;

    function run() external {
        require(block.chainid == 1, "Ethereum mainnet only");
        address owner = _owner("ETHEREUM_OWNER");
        _assertStartingNonce(owner, "ETHEREUM_START_NONCE");

        vm.startBroadcast();

        ETHOpenworkDAOV3 daoImplementation = new ETHOpenworkDAOV3();

        OpenworkVotingPowerCheckpoints checkpointsImplementation = new OpenworkVotingPowerCheckpoints();
        UUPSProxy checkpointsProxy = new UUPSProxy(
            address(checkpointsImplementation),
            abi.encodeCall(OpenworkVotingPowerCheckpoints.initialize, (owner, ETH_DAO_PROXY))
        );

        ETHDAOMessaging messagingImplementation = new ETHDAOMessaging();
        UUPSProxy messagingProxy = new UUPSProxy(
            address(messagingImplementation),
            abi.encodeCall(ETHDAOMessaging.initialize, (owner, ETH_DAO_PROXY, ETH_BRIDGE))
        );

        vm.stopBroadcast();

        console2.log("Ethereum DAO V3 implementation", address(daoImplementation));
        console2.log("Ethereum checkpoints V1 implementation", address(checkpointsImplementation));
        console2.log("Ethereum checkpoints V1 proxy", address(checkpointsProxy));
        console2.log("Ethereum DAO messaging V1 implementation", address(messagingImplementation));
        console2.log("Ethereum DAO messaging V1 proxy", address(messagingProxy));
    }
}

/// @dev Stable CREATE order from an owner nonce of 191:
///      bridge V3; DAO V2; checkpoints V1 implementation/proxy; stake-sync V1
///      implementation/proxy; Athena V9; NOWJC V5; ArbLOWJC V5;
///      ArbAthenaClient V3; ProfileGenesis V2; ProfileManager V3.
contract DeployArbitrumConfirmedUpgradeArtifacts19Jul2026 is ConfirmedUpgradeArtifacts19Jul2026 {
    uint32 internal constant ETHEREUM_EID = 30101;

    address internal constant ARBITRUM_LZ_ENDPOINT = 0x1a44076050125825900e736c501f859c50fE728c;
    address internal constant NATIVE_DAO_PROXY = 0x24af98d763724362DC920507b351cC99170a5aa4;
    address internal constant NATIVE_JOB_GENESIS = 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294;

    function run() external {
        require(block.chainid == 42161, "Arbitrum mainnet only");
        address owner = _owner("ARBITRUM_OWNER");
        _assertStartingNonce(owner, "ARBITRUM_START_NONCE");

        vm.startBroadcast();

        NativeLZOpenworkBridgeV3 nativeBridge = new NativeLZOpenworkBridgeV3(ARBITRUM_LZ_ENDPOINT, owner, ETHEREUM_EID);
        NativeOpenworkDAOV2 daoImplementation = new NativeOpenworkDAOV2();

        OpenworkVotingPowerCheckpoints checkpointsImplementation = new OpenworkVotingPowerCheckpoints();
        UUPSProxy checkpointsProxy = new UUPSProxy(
            address(checkpointsImplementation),
            abi.encodeCall(OpenworkVotingPowerCheckpoints.initialize, (owner, NATIVE_DAO_PROXY))
        );

        NativeDAOStakeSync stakeSyncImplementation = new NativeDAOStakeSync();
        UUPSProxy stakeSyncProxy = new UUPSProxy(
            address(stakeSyncImplementation),
            abi.encodeCall(
                NativeDAOStakeSync.initialize, (owner, address(nativeBridge), NATIVE_DAO_PROXY, NATIVE_JOB_GENESIS)
            )
        );

        NativeAthenaV9 athenaImplementation = new NativeAthenaV9();
        NativeOpenWorkJobContractV5 nowjcImplementation = new NativeOpenWorkJobContractV5();
        NativeArbOpenWorkJobContractV5 arbLowjcImplementation = new NativeArbOpenWorkJobContractV5();
        NativeArbAthenaClientV3 arbAthenaImplementation = new NativeArbAthenaClientV3();
        NativeProfileGenesisV2 profileGenesisImplementation = new NativeProfileGenesisV2();
        NativeProfileManagerV3 profileManagerImplementation = new NativeProfileManagerV3();

        vm.stopBroadcast();

        console2.log("Arbitrum native bridge V3", address(nativeBridge));
        console2.log("Arbitrum native DAO V2 implementation", address(daoImplementation));
        console2.log("Arbitrum checkpoints V1 implementation", address(checkpointsImplementation));
        console2.log("Arbitrum checkpoints V1 proxy", address(checkpointsProxy));
        console2.log("Arbitrum stake sync V1 implementation", address(stakeSyncImplementation));
        console2.log("Arbitrum stake sync V1 proxy", address(stakeSyncProxy));
        console2.log("Arbitrum NativeAthena V9 implementation", address(athenaImplementation));
        console2.log("Arbitrum NOWJC V5 implementation", address(nowjcImplementation));
        console2.log("Arbitrum ArbLOWJC V5 implementation", address(arbLowjcImplementation));
        console2.log("Arbitrum ArbAthenaClient V3 implementation", address(arbAthenaImplementation));
        console2.log("Arbitrum ProfileGenesis V2 implementation", address(profileGenesisImplementation));
        console2.log("Arbitrum ProfileManager V3 implementation", address(profileManagerImplementation));
    }
}

/// @dev Stable CREATE order from an owner nonce of 19: local bridge V2, then LOWJC V3 implementation.
contract DeployXdcConfirmedUpgradeArtifacts19Jul2026 is ConfirmedUpgradeArtifacts19Jul2026 {
    uint32 internal constant XDC_EID = 30365;
    uint32 internal constant ARBITRUM_EID = 30110;
    uint32 internal constant ETHEREUM_EID = 30101;

    address internal constant XDC_LZ_ENDPOINT = 0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa;

    function run() external {
        require(block.chainid == 50, "XDC mainnet only");
        address owner = _owner("XDC_OWNER");
        _assertStartingNonce(owner, "XDC_START_NONCE");

        vm.startBroadcast();

        LocalLZOpenworkBridgeV2 localBridge =
            new LocalLZOpenworkBridgeV2(XDC_LZ_ENDPOINT, owner, ARBITRUM_EID, ETHEREUM_EID, XDC_EID);
        LocalOpenWorkJobContractLiteV3 lowjcImplementation = new LocalOpenWorkJobContractLiteV3();

        vm.stopBroadcast();

        console2.log("XDC local bridge V2", address(localBridge));
        console2.log("XDC local LOWJC V3 implementation", address(lowjcImplementation));
    }
}
