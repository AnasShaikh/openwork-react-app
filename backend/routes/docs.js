const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname, '../../openclaw-skill');
const REFS_DIR = path.join(SKILL_DIR, 'references');
const CONTRACT_REGISTRY = require('../../docs/mainnet-contracts.json');

const contractApiNames = {
  'native-openwork-genesis': 'NativeOpenworkGenesis',
  nowjc: 'NOWJC',
  'native-arb-lowjc': 'NativeArbLOWJC',
  'native-arb-athena-client': 'NativeArbAthenaClient',
  'native-openwork-dao': 'NativeOpenworkDAO',
  'native-athena': 'NativeAthena',
  'native-profile-genesis': 'NativeProfileGenesis',
  'native-athena-activity-tracker': 'NativeAthenaActivityTracker',
  'native-athena-oracle-manager': 'NativeAthenaOracleManager',
  'native-profile-manager': 'NativeProfileManager',
  'native-voting-power-checkpoints': 'OpenworkVotingPowerCheckpoints',
  'native-dao-stake-sync': 'NativeDAOStakeSync',
  'native-lz-openwork-bridge': 'NativeLZOpenworkBridge',
  'native-rewards': 'NativeRewardsContract',
  'arbitrum-cctp-transceiver': 'CCTPTransceiver',
  'native-contract-registry': 'NativeContractRegistry',
  'native-genesis-reader': 'NativeGenesisReader',
  'optimism-lowjc': 'LOWJC',
  'optimism-local-athena': 'LocalAthena',
  'optimism-local-bridge': 'LocalLZOpenworkBridge',
  'optimism-cctp-transceiver': 'CCTPTransceiver',
  'xdc-lowjc': 'LOWJC',
  'xdc-local-athena': 'LocalAthena',
  'xdc-local-bridge': 'LocalLZOpenworkBridge',
  'xdc-cctp-transceiver': 'CCTPTransceiver',
  'eth-openwork-dao': 'ETHOpenworkDAO',
  'eth-voting-power-checkpoints': 'OpenworkVotingPowerCheckpoints',
  'eth-dao-messaging': 'ETHDAOMessaging',
  'eth-lz-openwork-bridge': 'ETHLZOpenworkBridge',
  'eth-rewards': 'ETHRewardsContract',
  'openwork-token': 'OpenworkToken'
};

function buildCompatibilityRegistry() {
  return Object.fromEntries(CONTRACT_REGISTRY.chains.map(chain => [
    chain.key,
    {
      chainId: chain.chainId,
      lzEid: chain.lzEid,
      cctpDomain: chain.cctpDomain,
      role: chain.role,
      contracts: Object.fromEntries(chain.contracts.map(contract => [
        contractApiNames[contract.id] || contract.id,
        contract.address
      ])),
      implementations: Object.fromEntries(chain.contracts
        .filter(contract => contract.implementation)
        .map(contract => [contractApiNames[contract.id] || contract.id, contract.implementation])),
      dependencies: chain.dependencies
    }
  ]));
}

/**
 * Helper: read a markdown file and return its content
 */
function readMarkdown(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * GET /api/docs
 * Returns a summary of all available documentation sections with links
 */
router.get('/', (req, res) => {
  res.json({
    name: 'OpenWork Documentation API',
    description: 'Machine-readable production documentation for the OpenWork decentralized freelancing protocol.',
    lastAudited: CONTRACT_REGISTRY.lastAudited,
    canonicalSource: CONTRACT_REGISTRY.canonicalSource,
    publicDocs: CONTRACT_REGISTRY.publicDocsUrl,
    sections: {
      skill: {
        description: 'OpenClaw skill package — main overview with capabilities, workflows, and contract addresses',
        endpoint: '/api/docs/skill'
      },
      references: {
        description: 'Detailed reference docs for each subsystem',
        endpoint: '/api/docs/references',
        topics: [
          'cross-chain-architecture',
          'job-creation-management',
          'direct-contracts',
          'payment-system',
          'membership-governance',
          'oracle-skill-verification',
          'rewards-system',
          'profile-management',
          'contract-registry',
          'error-reference'
        ]
      },
      contracts: {
        description: 'Live addresses, implementations, source files, verification status and pathway readiness for all production chains',
        endpoint: '/api/docs/contracts'
      },
      full: {
        description: 'Complete documentation bundle — SKILL.md + all references in one response',
        endpoint: '/api/docs/full'
      }
    },
    repos: {
      app: 'https://github.com/AnasShaikh/openwork-react-app',
      skill: 'https://github.com/AnasShaikh/openwork-react-app/tree/main/openclaw-skill'
    }
  });
});

/**
 * GET /api/docs/skill
 * Returns the main SKILL.md content
 */
router.get('/skill', (req, res) => {
  const content = readMarkdown(path.join(SKILL_DIR, 'SKILL.md'));
  if (!content) {
    return res.status(404).json({ error: 'SKILL.md not found' });
  }

  const format = req.query.format || 'markdown';
  if (format === 'json') {
    res.json({ file: 'SKILL.md', content });
  } else {
    res.type('text/markdown').send(content);
  }
});

/**
 * GET /api/docs/references
 * Returns a list of all reference documents
 */
router.get('/references', (req, res) => {
  try {
    const files = fs.readdirSync(REFS_DIR).filter(f => f.endsWith('.md'));
    const references = files.map(file => ({
      name: file.replace('.md', ''),
      file,
      endpoint: `/api/docs/references/${file.replace('.md', '')}`
    }));
    res.json({ references });
  } catch (err) {
    res.status(500).json({ error: 'Could not read references directory' });
  }
});

/**
 * GET /api/docs/references/:topic
 * Returns a specific reference document
 * e.g. /api/docs/references/payment-system
 */
router.get('/references/:topic', (req, res) => {
  const { topic } = req.params;
  const content = readMarkdown(path.join(REFS_DIR, `${topic}.md`));
  if (!content) {
    return res.status(404).json({ error: `Reference '${topic}' not found` });
  }

  const format = req.query.format || 'markdown';
  if (format === 'json') {
    res.json({ file: `${topic}.md`, content });
  } else {
    res.type('text/markdown').send(content);
  }
});

/**
 * GET /api/docs/contracts
 * Returns key contract addresses as structured JSON
 */
router.get('/contracts', (req, res) => {
  res.json({
    schemaVersion: CONTRACT_REGISTRY.schemaVersion,
    lastAudited: CONTRACT_REGISTRY.lastAudited,
    canonicalSource: CONTRACT_REGISTRY.canonicalSource,
    deploymentLedger: CONTRACT_REGISTRY.deploymentLedger,
    summary: CONTRACT_REGISTRY.summary,
    auditedBlocks: CONTRACT_REGISTRY.auditedBlocks,
    mainnet: buildCompatibilityRegistry(),
    external: {
      LayerZeroEndpointV2: '0x1a44076050125825900e736c501f859c50fE728c',
      chainIdentifiers: Object.fromEntries(CONTRACT_REGISTRY.chains.map(chain => [
        chain.key,
        { chainId: chain.chainId, lzEid: chain.lzEid, cctpDomain: chain.cctpDomain }
      ]))
    },
    chains: CONTRACT_REGISTRY.chains,
    pathways: CONTRACT_REGISTRY.pathways,
    legacyDeployments: CONTRACT_REGISTRY.legacyDeployments,
    heldNotLive: CONTRACT_REGISTRY.heldNotLive
  });
});

/**
 * GET /api/docs/full
 * Returns the complete documentation bundle — SKILL.md + all references
 */
router.get('/full', (req, res) => {
  const skill = readMarkdown(path.join(SKILL_DIR, 'SKILL.md'));

  let references = {};
  try {
    const files = fs.readdirSync(REFS_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const name = file.replace('.md', '');
      references[name] = readMarkdown(path.join(REFS_DIR, file));
    }
  } catch (err) {
    // references dir may not exist
  }

  res.json({
    skill: skill || 'SKILL.md not found',
    references,
    contractRegistry: CONTRACT_REGISTRY,
    repos: {
      app: 'https://github.com/AnasShaikh/openwork-react-app',
      skill: 'https://github.com/AnasShaikh/openwork-react-app/tree/main/openclaw-skill'
    }
  });
});

module.exports = router;
