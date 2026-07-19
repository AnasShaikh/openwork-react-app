// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ETHOpenworkDAO as ETHOpenworkDAOV3} from "../src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol";
import {ETHDAOMessaging} from "../src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol";
import {
    NativeOpenworkDAO as NativeOpenworkDAOV2
} from "../src/suites/current-mainnet/native/native-openwork-dao-v2.sol";
import {
    OpenworkVotingPowerCheckpoints
} from "../src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol";
import {NativeAthenaV9} from "../src/suites/current-mainnet/native/native-athena-v9.sol";
import {
    NativeOpenWorkJobContract as NativeOpenWorkJobContractV5
} from "../src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol";
import {
    NativeArbOpenWorkJobContractV5 as NativeArbLOWJCV5
} from "../src/suites/current-mainnet/native/native-arb-lowjc-v5.sol";
import {NativeArbAthenaClientV3} from "../src/suites/current-mainnet/native/native-arb-athena-client-v3.sol";
import {
    NativeProfileManager as NativeProfileManagerV3
} from "../src/suites/current-mainnet/native/native-profile-manager-v3.sol";
import {
    NativeProfileGenesis as NativeProfileGenesisV2
} from "../src/suites/current-mainnet/native/native-profile-genesis-v2.sol";
import {
    LocalOpenWorkJobContractLite as LocalLOWJCV3
} from "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol";

interface IUUPSProxy {
    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable;
}

interface IETHDAOV3Read {
    function bridge() external view returns (address);
    function getCombinedGovernancePower(address account) external view returns (uint256);
    function syncVotingPower(address[] calldata accounts) external;
}

interface ICheckpointRead {
    function latestVotes(address account) external view returns (uint256);
}

interface INativeDAOV2Read {
    function votingPowerCheckpoints() external view returns (address);
}

interface IProfileManagerV3Read {
    function jobGenesis() external view returns (address);
}

interface ILocalLOWJCV3Read {
    function pendingStartApplicationId(string calldata jobId) external view returns (uint256);
}

/// @notice Read-only mainnet-fork upgrade rehearsal. Set RUN_LIVE_FORK_TESTS=true locally.
/// @dev vm.prank mutates only the ephemeral fork. No transaction is signed or broadcast.
contract CurrentMainnetLiveForkUpgradesTest is Test {
    address internal constant OWNER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;

    address internal constant ETH_DAO = 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294;

    address internal constant ARB_GENESIS = 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294;
    address internal constant ARB_NATIVE_DAO = 0x24af98d763724362DC920507b351cC99170a5aa4;
    address internal constant ARB_NATIVE_ATHENA = 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf;
    address internal constant ARB_NOWJC = 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99;
    address internal constant ARB_LOWJC = 0x5727cA7326032a8644a49dECECB8388BEF122bef;
    address internal constant ARB_ATHENA_CLIENT = 0xB5d3F406089236ef9d4aB13306187aFCCA81f099;
    address internal constant ARB_PROFILE_GENESIS = 0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E;
    address internal constant ARB_PROFILE_MANAGER = 0x51285003A01319c2f46BB2954384BCb69AfB1b45;

    address internal constant XDC_LOWJC = 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7;

    address internal constant ETH_REWARD_ACCOUNT_1 = 0x93514040f43aB16D52faAe7A3f380c4089D844F9;
    address internal constant ETH_REWARD_ACCOUNT_2 = 0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724;

    function _enabled() internal view returns (bool) {
        return vm.envOr("RUN_LIVE_FORK_TESTS", false);
    }

    function _snapshotSlots(address target, uint256 count) internal view returns (bytes32[] memory values) {
        values = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            values[i] = vm.load(target, bytes32(i));
        }
    }

    function _assertSlots(address target, bytes32[] memory expected) internal view {
        for (uint256 i = 0; i < expected.length; i++) {
            assertEq(vm.load(target, bytes32(i)), expected[i], "deployed storage slot changed");
        }
    }

    function _upgrade(address proxy, address implementation, bytes memory data) internal {
        vm.prank(OWNER);
        IUUPSProxy(proxy).upgradeToAndCall(implementation, data);
    }

    function _checkpointProxy(address dao) internal returns (address proxy) {
        OpenworkVotingPowerCheckpoints implementation = new OpenworkVotingPowerCheckpoints();
        proxy = address(
            new ERC1967Proxy(
                address(implementation), abi.encodeCall(OpenworkVotingPowerCheckpoints.initialize, (OWNER, dao))
            )
        );
    }

    function testArbitrumLiveProxyUpgradeRehearsal() external {
        if (!_enabled()) return;
        vm.createSelectFork(vm.envOr("ARBITRUM_MAINNET_RPC_URL", string("https://arb1.arbitrum.io/rpc")));

        address nativeCheckpoints = _checkpointProxy(ARB_NATIVE_DAO);

        bytes32[] memory nativeDaoSlots = _snapshotSlots(ARB_NATIVE_DAO, 11);
        NativeOpenworkDAOV2 nativeDaoImplementation = new NativeOpenworkDAOV2();
        _upgrade(
            ARB_NATIVE_DAO,
            address(nativeDaoImplementation),
            abi.encodeCall(NativeOpenworkDAOV2.initializeV2, (nativeCheckpoints))
        );
        _assertSlots(ARB_NATIVE_DAO, nativeDaoSlots);
        assertEq(INativeDAOV2Read(ARB_NATIVE_DAO).votingPowerCheckpoints(), nativeCheckpoints);

        bytes32[] memory athenaSlots = _snapshotSlots(ARB_NATIVE_ATHENA, 32);
        _upgrade(ARB_NATIVE_ATHENA, address(new NativeAthenaV9()), bytes(""));
        _assertSlots(ARB_NATIVE_ATHENA, athenaSlots);

        bytes32[] memory nowjcSlots = _snapshotSlots(ARB_NOWJC, 32);
        _upgrade(ARB_NOWJC, address(new NativeOpenWorkJobContractV5()), bytes(""));
        _assertSlots(ARB_NOWJC, nowjcSlots);

        bytes32[] memory arbLowjcSlots = _snapshotSlots(ARB_LOWJC, 24);
        _upgrade(ARB_LOWJC, address(new NativeArbLOWJCV5()), bytes(""));
        _assertSlots(ARB_LOWJC, arbLowjcSlots);

        bytes32[] memory arbAthenaClientSlots = _snapshotSlots(ARB_ATHENA_CLIENT, 24);
        _upgrade(ARB_ATHENA_CLIENT, address(new NativeArbAthenaClientV3()), bytes(""));
        _assertSlots(ARB_ATHENA_CLIENT, arbAthenaClientSlots);

        bytes32[] memory profileGenesisSlots = _snapshotSlots(ARB_PROFILE_GENESIS, 24);
        _upgrade(ARB_PROFILE_GENESIS, address(new NativeProfileGenesisV2()), bytes(""));
        _assertSlots(ARB_PROFILE_GENESIS, profileGenesisSlots);

        bytes32[] memory profileManagerSlots = _snapshotSlots(ARB_PROFILE_MANAGER, 7);
        _upgrade(
            ARB_PROFILE_MANAGER,
            address(new NativeProfileManagerV3()),
            abi.encodeCall(NativeProfileManagerV3.initializeV3, (ARB_GENESIS))
        );
        _assertSlots(ARB_PROFILE_MANAGER, profileManagerSlots);
        assertEq(IProfileManagerV3Read(ARB_PROFILE_MANAGER).jobGenesis(), ARB_GENESIS);
    }

    function testEthereumLiveDAOUpgradeAndCheckpointMigration() external {
        if (!_enabled()) return;
        vm.createSelectFork(vm.envOr("ETHEREUM_MAINNET_RPC_URL", string("https://ethereum-rpc.publicnode.com")));

        address checkpoints = _checkpointProxy(ETH_DAO);
        address liveBridge = IETHDAOV3Read(ETH_DAO).bridge();

        ETHDAOMessaging messagingImplementation = new ETHDAOMessaging();
        address messaging = address(
            new ERC1967Proxy(
                address(messagingImplementation),
                abi.encodeCall(ETHDAOMessaging.initialize, (OWNER, ETH_DAO, liveBridge))
            )
        );

        bytes32[] memory daoSlots = _snapshotSlots(ETH_DAO, 14);
        _upgrade(
            ETH_DAO,
            address(new ETHOpenworkDAOV3()),
            abi.encodeCall(ETHOpenworkDAOV3.initializeV3, (checkpoints, messaging))
        );
        _assertSlots(ETH_DAO, daoSlots);

        address[] memory accounts = new address[](2);
        accounts[0] = ETH_REWARD_ACCOUNT_1;
        accounts[1] = ETH_REWARD_ACCOUNT_2;
        IETHDAOV3Read(ETH_DAO).syncVotingPower(accounts);

        for (uint256 i = 0; i < accounts.length; i++) {
            assertEq(
                ICheckpointRead(checkpoints).latestVotes(accounts[i]),
                IETHDAOV3Read(ETH_DAO).getCombinedGovernancePower(accounts[i])
            );
        }
    }

    function testXDCLiveLOWJCUpgradeRehearsal() external {
        if (!_enabled()) return;
        vm.createSelectFork(vm.envOr("XDC_MAINNET_RPC_URL", string("https://rpc.xdc.network")));

        bytes32[] memory lowjcSlots = _snapshotSlots(XDC_LOWJC, 24);
        _upgrade(XDC_LOWJC, address(new LocalLOWJCV3()), bytes(""));
        _assertSlots(XDC_LOWJC, lowjcSlots);
        assertEq(ILocalLOWJCV3Read(XDC_LOWJC).pendingStartApplicationId("30365-1"), 0);
    }
}
