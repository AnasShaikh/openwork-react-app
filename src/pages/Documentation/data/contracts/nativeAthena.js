export const nativeAthena = {
  id: 'nativeAthena',
  name: 'Native Athena',
  chain: 'l2',
  column: 'l2-left',
  order: 1,
  status: 'testnet',
  version: 'v1.0.0',
  gas: '78K',
  mainnetNetwork: 'Arbitrum One',
  testnetNetwork: 'Arbitrum Sepolia',
  mainnetDeployed: 'Not deployed',
  testnetDeployed: 'Deployed',
  mainnetAddress: null,
  testnetAddress: '0x098E52Aff44AEAd944AFf86F4A5b90dbAF5B86bd',
  isUUPS: true,
  implementationAddress: '0xf360c9a73536a1016d1d35f80f2333a16fb2a4d2',
  tvl: 'N/A',
  docs: 'Native Athena - Decentralized dispute resolution, skill verification, and oracle governance system with proportional fee distribution.',
  
  overview: {
    purpose: 'Native Athena is the governance and dispute resolution hub for OpenWork, handling three key functions: (1) Job dispute resolution through community voting, (2) Skill verification for oracle members, and (3) Ask Athena consultations. The contract verifies voter eligibility through Native DAO (checking staked + earned tokens), collects weighted votes during configurable voting periods, and distributes fees proportionally to winning voters. All data is stored in OpenworkGenesis for persistence.',
    tier: 'Native Chain (Arbitrum Sepolia)',
    category: 'Governance & Dispute Resolution',
    upgradeability: 'UUPS Upgradeable (owner + bridge can upgrade)'
  },
  
  features: [
    'Multi-type voting: Handles disputes, skill verifications, and Ask Athena consultations',
    'Eligibility verification: Checks voting power through Native DAO (staked + earned tokens)',
    'Weighted voting: Vote weight calculated from stake duration and earned tokens',
    'Proportional fee distribution: Winners receive fees based on their voting power contribution',
    'Oracle management: Create, update, and manage skill oracles with member verification',
    'Configurable voting periods: Owner can set voting duration (default 60 minutes)',
    'Cross-chain fund release: Integrates with NOWJC for dispute fund distribution via CCTP',
    'Multi-dispute support: Jobs can have multiple disputes with counter tracking'
  ],
  
  systemPosition: {
    description: 'Native Athena is the central dispute resolution hub that receives disputes from ANY Local chain via LayerZero messaging. Users interact with Athena Client contracts deployed on each Local chain (Ethereum, Optimism, Base, etc.) to raise disputes, submit skill verifications, or ask oracle questions. Athena Client collects USDC fees and routes them via CCTP directly to Native Athena, then sends dispute data through the LayerZero bridge (Local Bridge contract on source chain → Native Bridge contract on Native chain). Native Athena verifies voter eligibility through Native DAO, collects weighted votes, determines outcomes, distributes fees proportionally to winning voters, and triggers fund releases via NOWJC. This multi-chain architecture allows users to raise disputes from any supported chain while maintaining centralized voting and resolution on Arbitrum.',
    diagram: `
📍 Multi-Chain Dispute Resolution Architecture

User on ANY Local Chain
    └─> Athena Client (Local Chain)
        ├─> Collect USDC fee
        ├─> Route fee via CCTP → Native Athena
        └─> Send dispute data via LayerZero
            ↓
    Local Bridge (LayerZero OApp)
        └─> Forward to Native chain
            ↓
    Native Bridge (LayerZero OApp)
        └─> Route to Native Athena
            ↓
    Native Athena ⭐ (You are here)
        ├─> handleRaiseDispute() creates dispute
        ├─> Check Eligibility
        │   └─> Native DAO.canVote()
        │       ├─ Staked tokens * duration
        │       └─ Earned tokens from jobs
        │
        ├─> Collect Votes
        │   └─> OpenworkGenesis
        │       ├─ Store voter data
        │       ├─ Track voting power
        │       └─ Record vote side
        │
        └─> Settlement
            ├─> Calculate winning side
            ├─> Distribute fees proportionally
            │   └─> USDC to winning voters
            ├─> Release dispute funds
            │   └─> NOWJC.releaseDisputedFunds()
            │       └─> CCTP to winner's chain
            └─> Send resolution back
                └─> Native Bridge → Local Bridge
                    └─> Athena Client
                        └─> Auto-resolve in LOWJC`
  },
  
  dependencies: {
    dependsOn: [
      { 
        name: 'OpenworkGenesis', 
        reason: 'Stores all dispute data, vote records, voter information, and oracle configurations.',
        type: 'Storage'
      },
      { 
        name: 'Native Bridge', 
        reason: 'Routes dispute creation messages from all Local chains. Calls handleRaiseDispute(), handleSubmitSkillVerification(), and handleAskAthena().',
        type: 'Bridge'
      },
      { 
        name: 'Native DAO', 
        reason: 'Provides voter eligibility checks via getStakerInfo() for stake-based voting power.',
        type: 'Governance'
      },
      { 
        name: 'NOWJC', 
        reason: 'Provides earned token data via getUserEarnedTokens() and releases disputed funds via releaseDisputedFunds().',
        type: 'Job Management'
      },
      {
        name: 'USDC Token',
        reason: 'Used for fee payments (received via CCTP) and proportional distribution to winning voters.',
        type: 'Token'
      },
      {
        name: 'Oracle Manager',
        reason: 'Handles oracle creation, member management, and skill verification (optional integration).',
        type: 'Governance'
      }
    ],
    requiredBy: [
      { 
        name: 'Athena Client (All Local Chains)', 
        reason: 'User-facing entry point on each Local chain. Collects fees, routes via CCTP, sends dispute data via LayerZero.',
        type: 'Client Interface'
      },
      { 
        name: 'Frontend Applications', 
        reason: 'Display disputes, skill verifications, voting interfaces, and results.',
        type: 'User Interface'
      },
      { 
        name: 'Native Bridge', 
        reason: 'Receives settlement results and voter data to send back to Local chains for auto-resolution.',
        type: 'Bridge'
      }
    ],
    prerequisites: [
      'OpenworkGenesis deployed for data storage',
      'Native DAO deployed for stake-based eligibility',
      'NOWJC deployed for earned tokens and fund release',
      'USDC token contract address configured',
      'minStakeRequired set (default: 100 tokens)',
      'votingPeriodMinutes configured (default: 60 minutes)'
    ]
  },
  
  functions: [
    {
      category: 'Dispute Management',
      description: 'Functions for creating and settling job disputes with community voting',
      items: [
        {
          name: 'handleRaiseDispute',
          signature: 'handleRaiseDispute(string jobId, string disputeHash, string oracleName, uint256 fee, uint256 disputedAmount, address disputeRaiser)',
          whatItDoes: 'Creates a new dispute for a job, requiring an active oracle and generating a unique dispute ID with counter.',
          whyUse: 'Called by bridge when either party raises a dispute on a Local chain. Creates dispute record and starts voting period.',
          howItWorks: [
            'Validates oracle exists and has minimum required members',
            'Increments dispute counter for the job (jobDisputeCounters[jobId])',
            'Creates dispute ID: jobId + "-" + counter (e.g., "40232-57-1")',
            'Records dispute start time in disputeStartTimes mapping',
            'Calls genesis.setDispute() with all parameters',
            'Emits DisputeRaised event'
          ],
          parameters: [
            { name: 'jobId', type: 'string', description: 'Original job identifier (e.g., "40232-57")' },
            { name: 'disputeHash', type: 'string', description: 'IPFS hash containing dispute details and evidence' },
            { name: 'oracleName', type: 'string', description: 'Name of oracle that will govern this dispute' },
            { name: 'fee', type: 'uint256', description: 'USDC fee amount to be distributed to voters' },
            { name: 'disputedAmount', type: 'uint256', description: 'Amount of USDC in dispute from job escrow' },
            { name: 'disputeRaiser', type: 'address', description: 'Address raising the dispute (job giver or freelancer)' }
          ],
          accessControl: 'Bridge-only: Intended to be called by Native Bridge (commented out in code)',
          events: [
            'DisputeRaised(jobId, disputeRaiser, fees)'
          ],
          gasEstimate: '~72K gas',
          example: `// Called by bridge after cross-chain message
// User initiated dispute on Local chain with evidence
await nativeAthena.handleRaiseDispute(
  "40232-57",  // Job ID
  "QmDispute123...",  // IPFS evidence
  "DeveloperOracle",  // Oracle name
  ethers.parseUnits("100", 6),  // 100 USDC fee
  ethers.parseUnits("2000", 6),  // 2000 USDC disputed
  disputeRaiserAddress
);

// Creates dispute ID: "40232-57-1"
// Voting period starts immediately`,
          relatedFunctions: ['vote', 'settleDispute']
        },
        {
          name: 'vote',
          signature: 'vote(VotingType _votingType, string _disputeId, bool _voteFor, address _claimAddress)',
          whatItDoes: 'Casts a weighted vote on a dispute, skill verification, or Ask Athena application after eligibility check.',
          whyUse: 'Community members with sufficient voting power vote to resolve disputes and verifications. Vote weight is calculated from staked + earned tokens.',
          howItWorks: [
            'Calls canVote() to verify user has minimum required tokens',
            'Calculates vote weight via getUserVotingPower() (stake*duration + earned)',
            'Stores voter data in Genesis with claim address and voting power',
            'Routes to internal _voteOnDispute, _voteOnSkillVerification, or _voteOnAskAthena',
            'Updates vote counters in Genesis (votesFor or votesAgainst)',
            'Marks user as having voted to prevent double voting',
            'Calls NOWJC.incrementGovernanceAction() for rewards',
            'Requires vote weight > 0 and claim address != zero'
          ],
          parameters: [
            { name: '_votingType', type: 'VotingType', description: 'Enum: Dispute(0), SkillVerification(1), or AskAthena(2)' },
            { name: '_disputeId', type: 'string', description: 'Dispute ID or application ID as string (e.g., "40232-57-1" or "5")' },
            { name: '_voteFor', type: 'bool', description: 'true = vote for dispute raiser/applicant, false = vote against' },
            { name: '_claimAddress', type: 'address', description: 'Address where voter wants to receive fee rewards' }
          ],
          accessControl: 'Public function - anyone with sufficient voting power can call',
          events: ['None directly (internal functions emit events)'],
          gasEstimate: '~68K gas',
          example: `// Check eligibility first
const canVote = await nativeAthena.canVote(userAddress);
if (!canVote) {
  console.log("Need minStakeRequired tokens to vote");
  return;
}

// Get voting power
const votingPower = await nativeAthena.getUserVotingPower(userAddress);
console.log(\`Voting with \${ethers.formatEther(votingPower)} power\`);

// Vote on dispute (VotingType.Dispute = 0)
await nativeAthena.vote(
  0,  // VotingType.Dispute
  "40232-57-1",  // Dispute ID
  true,  // Vote for dispute raiser
  userAddress  // Claim address for fees
);

// Vote recorded with weight
// Will receive proportional fee share if wins`,
          relatedFunctions: ['canVote', 'getUserVotingPower', 'settleDispute']
        },
        {
          name: 'settleDispute',
          signature: 'settleDispute(string _disputeId)',
          whatItDoes: 'Finalizes a dispute after voting period, determines winner by vote count, distributes fees proportionally, and releases funds to winner.',
          whyUse: 'Called after voting period ends to execute the community decision and distribute rewards.',
          howItWorks: [
            'Validates dispute exists and voting period ended (block.timestamp >= startTime + votingPeriodMinutes*60)',
            'Retrieves dispute from Genesis, checks not already finalized',
            'Determines winner: votesFor > votesAgainst means dispute raiser wins',
            'Calls genesis.finalizeDispute() with result',
            'Extracts original job ID from dispute ID',
            'Determines fund recipient based on who raised dispute and who won',
            'Calls NOWJC.releaseDisputedFunds() if applicable',
            'If no votes cast: refunds fees to dispute raiser',
            'If votes cast: calls _distributeFeeToWinningVoters()',
            'Emits DisputeFinalized event'
          ],
          parameters: [
            { name: '_disputeId', type: 'string', description: 'Dispute identifier to finalize (e.g., "40232-57-1")' }
          ],
          accessControl: 'Public function - anyone can call after voting period',
          events: [
            'DisputeFinalized(disputeId, winningSide, totalVotesFor, totalVotesAgainst)',
            'FeeDistributed(disputeId, recipient, amount) [for each voter]',
            'DisputeFeeRefunded(disputeId, disputeRaiser, amount, targetChain) [if no votes]'
          ],
          gasEstimate: '~120K gas + variable (depends on number of voters)',
          example: `// Check if voting period ended
const dispute = await nativeAthena.getDispute("40232-57-1");
const startTime = await nativeAthena.disputeStartTimes("40232-57-1");
const votingPeriod = await nativeAthena.votingPeriodMinutes();
const endTime = startTime + (votingPeriod * 60);

if (Date.now() / 1000 >= endTime && !dispute.isFinalized) {
  // Settle dispute
  await nativeAthena.settleDispute("40232-57-1");
  
  // Results:
  // - Winner determined by vote count
  // - Fees distributed proportionally to winning voters
  // - Escrowed funds released to winner via CCTP
  // - Or fees refunded if no votes
  
  console.log("Dispute settled");
  console.log("Winner:", dispute.votesFor > dispute.votesAgainst ? "Raiser" : "Opponent");
}`,
          relatedFunctions: ['handleRaiseDispute', 'vote', 'getDispute']
        }
      ]
    },
    {
      category: 'Skill Verification',
      description: 'Functions for verifying skills of oracle members through community voting',
      items: [
        {
          name: 'handleSubmitSkillVerification',
          signature: 'handleSubmitSkillVerification(address applicant, string applicationHash, uint256 feeAmount, string targetOracleName)',
          whatItDoes: 'Submits a skill verification application for oracle membership with fee payment.',
          whyUse: 'Users apply to become verified members of skill oracles by submitting credentials for community review.',
          howItWorks: [
            'Gets current application counter from Genesis',
            'Calls genesis.setSkillApplication() with all parameters',
            'Increments application counter',
            'Starts voting period automatically',
            'Emits SkillVerificationSubmitted event'
          ],
          parameters: [
            { name: 'applicant', type: 'address', description: 'Address applying for skill verification' },
            { name: 'applicationHash', type: 'string', description: 'IPFS hash with credentials, portfolio, certifications' },
            { name: 'feeAmount', type: 'uint256', description: 'USDC fee to be distributed to voters' },
            { name: 'targetOracleName', type: 'string', description: 'Name of oracle applying to join' }
          ],
          accessControl: 'Bridge-only: Intended to be called by Native Bridge (commented out)',
          events: [
            'SkillVerificationSubmitted(applicant, targetOracleName, feeAmount, applicationId)'
          ],
          gasEstimate: '~58K gas',
          example: `// Called by bridge after user submits on Local chain
await nativeAthena.handleSubmitSkillVerification(
  applicantAddress,
  "QmCredentials123...",  // Portfolio/certs
  ethers.parseUnits("50", 6),  // 50 USDC fee
  "ReactDevelopers"
);

// Application ID auto-assigned
// Voting begins immediately`,
          relatedFunctions: ['vote', 'finalizeSkillVerification']
        },
        {
          name: 'finalizeSkillVerification',
          signature: 'finalizeSkillVerification(uint256 _applicationId)',
          whatItDoes: 'Finalizes skill verification after voting period, adds applicant to oracle if approved, distributes fees to winners.',
          whyUse: 'Called after voting period to execute community decision on skill verification.',
          howItWorks: [
            'Retrieves application from Genesis',
            'Validates exists, not finalized, voting active, period expired',
            'Determines result: votesFor > votesAgainst means approved',
            'Calls genesis.finalizeSkillVerification()',
            'If approved: calls genesis.addSkillVerifiedAddress()',
            'Calls _distributeFeeToWinningVoters() with winning side',
            'Emits SkillVerificationSettled event'
          ],
          parameters: [
            { name: '_applicationId', type: 'uint256', description: 'Application ID to finalize' }
          ],
          accessControl: 'Public function - anyone can call after voting period',
          events: [
            'SkillVerificationSettled(applicationId, result, totalVotesFor, totalVotesAgainst)'
          ],
          gasEstimate: '~85K gas',
          example: `// After voting period
const application = await genesis.getSkillApplication(5);

if (application.timeStamp + (votingPeriod * 60) <= Date.now() / 1000) {
  await nativeAthena.finalizeSkillVerification(5);
  
  // If approved: applicant added to oracle
  // Fees distributed to winning voters proportionally
}`,
          relatedFunctions: ['handleSubmitSkillVerification', 'vote']
        }
      ]
    },
    {
      category: 'Ask Athena',
      description: 'Functions for oracle consultations and advisory voting',
      items: [
        {
          name: 'handleAskAthena',
          signature: 'handleAskAthena(address applicant, string description, string hash, string targetOracle, string fees)',
          whatItDoes: 'Submits a question or consultation request to a specific oracle for community advisory vote.',
          whyUse: 'Users can request advisory opinions from skill oracles on technical questions or decisions.',
          howItWorks: [
            'Validates caller is bridge',
            'Gets current Ask Athena counter from Genesis',
            'Calls genesis.setAskAthenaApplication() with parameters',
            'Increments counter',
            'Emits AskAthenaSubmitted event'
          ],
          parameters: [
            { name: 'applicant', type: 'address', description: 'Address asking the question' },
            { name: 'description', type: 'string', description: 'Question or consultation topic' },
            { name: 'hash', type: 'string', description: 'IPFS hash with detailed question and context' },
            { name: 'targetOracle', type: 'string', description: 'Oracle name to consult' },
            { name: 'fees', type: 'string', description: 'Fee amount as string' }
          ],
          accessControl: 'Bridge-only: Only Native Bridge can call',
          events: [
            'AskAthenaSubmitted(applicant, targetOracle, fees)'
          ],
          gasEstimate: '~55K gas',
          example: `// User asks oracle question on Local chain
// Bridge calls Native Athena
await nativeAthena.handleAskAthena(
  userAddress,
  "Should we refactor the auth module?",
  "QmQuestion123...",
  "SecurityOracle",
  "25000000"  // 25 USDC as string
);`,
          relatedFunctions: ['vote', 'settleAskAthena']
        },
        {
          name: 'settleAskAthena',
          signature: 'settleAskAthena(uint256 _athenaId)',
          whatItDoes: 'Finalizes Ask Athena consultation after voting period, records advisory result, distributes fees.',
          whyUse: 'Called after voting to record oracle\'s advisory opinion and reward voters.',
          howItWorks: [
            'Retrieves Ask Athena application from Genesis',
            'Validates exists, not finalized, voting active, period expired',
            'Determines result: votesFor > votesAgainst',
            'Calls genesis.finalizeAskAthena() with result',
            'Parses fee amount from string',
            'Calls _distributeFeeToWinningVoters()',
            'Emits AskAthenaSettled event'
          ],
          parameters: [
            { name: '_athenaId', type: 'uint256', description: 'Ask Athena application ID to finalize' }
          ],
          accessControl: 'Public function - anyone can call after voting period',
          events: [
            'AskAthenaSettled(athenaId, result, totalVotesFor, totalVotesAgainst)'
          ],
          gasEstimate: '~82K gas',
          example: `// After voting period ends
await nativeAthena.settleAskAthena(3);

// Result recorded (advisory only)
// Fees distributed to winning voters`,
          relatedFunctions: ['handleAskAthena', 'vote']
        }
      ]
    },
    {
      category: 'Voting Eligibility',
      description: 'Functions for checking voter eligibility and calculating voting power',
      items: [
        {
          name: 'canVote',
          signature: 'canVote(address account) view returns (bool)',
          whatItDoes: 'Checks if an address meets the minimum threshold to vote by checking staked and earned tokens.',
          whyUse: 'Quick eligibility check before allowing vote submission.',
          howItWorks: [
            'If daoContract set: calls INativeDAO.getStakerInfo()',
            'Checks if stake active and amount >= minStakeRequired',
            'If sufficient stake: returns true',
            'Otherwise: calls nowjContract.getUserEarnedTokens()',
            'Returns true if earned tokens >= minStakeRequired',
            'Returns false if neither condition met'
          ],
          parameters: [
            { name: 'account', type: 'address', description: 'Address to check eligibility' }
          ],
          accessControl: 'Public view function',
          events: ['None (view function)'],
          gasEstimate: 'N/A (view)',
          example: `// Check if user can vote
const canVote = await nativeAthena.canVote(userAddress);

if (canVote) {
  console.log("Eligible to vote");
  // Show voting interface
} else {
  const minRequired = await nativeAthena.minStakeRequired();
  console.log(\`Need \${ethers.formatEther(minRequired)} tokens (staked or earned)\`);
}`,
          relatedFunctions: ['getUserVotingPower', 'vote']
        },
        {
          name: 'getUserVotingPower',
          signature: 'getUserVotingPower(address account) view returns (uint256)',
          whatItDoes: 'Calculates total voting power from staked tokens (stake * duration) plus earned tokens.',
          whyUse: 'Determines vote weight for a user. Higher stake duration and earned tokens = more voting power.',
          howItWorks: [
            'Initializes totalVotingPower = 0',
            'If daoContract set: gets stake info',
            'If stake active: adds (stakeAmount * durationMinutes)',
            'If nowjContract set: gets earned tokens',
            'Adds earned tokens to total',
            'Returns total voting power'
          ],
          parameters: [
            { name: 'account', type: 'address', description: 'Address to calculate voting power for' }
          ],
          accessControl: 'Public view function',
          events: ['None (view function)'],
          gasEstimate: 'N/A (view)',
          example: `// Get user's voting power
const power = await nativeAthena.getUserVotingPower(userAddress);
console.log(\`Voting power: \${power.toString()}\`);

// Example calculation:
// - Staked 500 tokens for 3 months (129,600 min)
// - Earned 200 tokens from jobs
// - Total power = (500 * 129,600) + 200 = 64,800,200

// Higher power = bigger share of fees if win`,
          relatedFunctions: ['canVote', 'getUserVotingInfo']
        },
        {
          name: 'getUserVotingInfo',
          signature: 'getUserVotingInfo(address account) view returns (bool hasActiveStake, uint256 stakeAmount, uint256 earnedTokens, uint256 totalVotingPower, bool meetsVotingThreshold)',
          whatItDoes: 'Returns complete voting information for an address including stake status, earned tokens, total power, and eligibility.',
          whyUse: 'Single call to get all voting-related info for UI display.',
          howItWorks: [
            'If daoContract set: gets stake info, sets hasActiveStake and stakeAmount',
            'If nowjContract set: gets earnedTokens',
            'Calls getUserVotingPower() for totalVotingPower',
            'Calls canVote() for meetsVotingThreshold',
            'Returns all values as struct'
          ],
          parameters: [
            { name: 'account', type: 'address', description: 'Address to get info for' }
          ],
          accessControl: 'Public view function',
          events: ['None (view function)'],
          gasEstimate: 'N/A (view)',
          example: `// Get comprehensive voting info
const info = await nativeAthena.getUserVotingInfo(userAddress);

console.log("Has active stake:", info.hasActiveStake);
console.log("Stake amount:", ethers.formatEther(info.stakeAmount));
console.log("Earned tokens:", ethers.formatEther(info.earnedTokens));
console.log("Total voting power:", info.totalVotingPower.toString());
console.log("Can vote:", info.meetsVotingThreshold);`,
          relatedFunctions: ['canVote', 'getUserVotingPower']
        }
      ]
    },
    {
      category: 'View Functions',
      description: 'Read-only functions for querying dispute and application data',
      items: [
        {
          name: 'getDispute',
          signature: 'getDispute(string _disputeId) view returns (Dispute)',
          whatItDoes: 'Retrieves complete dispute information from Genesis.',
          whyUse: 'Query dispute details including votes, status, fees, and timestamps.',
          howItWorks: [
            'Queries genesis.getDispute()',
            'Converts Genesis dispute struct to local Dispute struct',
            'Returns all dispute fields'
          ],
          parameters: [
            { name: '_disputeId', type: 'string', description: 'Dispute identifier' }
          ],
          accessControl: 'Public view function',
          events: ['None (view function)'],
          gasEstimate: 'N/A (view)',
          example: `const dispute = await nativeAthena.getDispute("40232-57-1");

console.log("Job ID:", dispute.jobId);
console.log("Disputed amount:", ethers.formatUnits(dispute.disputedAmount, 6));
console.log("Raiser:", dispute.disputeRaiserAddress);
console.log("Votes for:", dispute.votesFor.toString());
console.log("Votes against:", dispute.votesAgainst.toString());
console.log("Is finalized:", dispute.isFinalized);
console.log("Fees:", ethers.formatUnits(dispute.fees, 6));`,
          relatedFunctions: ['settleDispute', 'vote']
        },
        {
          name: 'hasVotedOnDispute',
          signature: 'hasVotedOnDispute(string _disputeId, address _user) view returns (bool)',
          whatItDoes: 'Checks if a user has already voted on a specific dispute.',
          whyUse: 'Prevent double voting and show vote status in UI.',
          howItWorks: [
            'Calls genesis.hasUserVotedOnDispute()',
            'Returns boolean result'
          ],
          parameters: [
            { name: '_disputeId', type: 'string', description: 'Dispute to check' },
            { name: '_user', type: 'address', description: 'User address to check' }
          ],
          accessControl: 'Public view function',
          events: ['None (view function)'],
          gasEstimate: 'N/A (view)',
          example: `const hasVoted = await nativeAthena.hasVotedOnDispute("40232-57-1", userAddress);

if (hasVoted) {
  console.log("You already voted on this dispute");
} else {
  console.log("You can vote");
}`,
          relatedFunctions: ['vote', 'hasVotedOnSkillApplication', 'hasVotedOnAskAthena']
        }
      ]
    }
  ],
  
  dataFlows: [
    {
      title: 'Complete Dispute Resolution Flow',
      description: 'End-to-end flow from dispute creation to settlement',
      steps: [
        { chain: 'Local Chain', action: '1. Job conflict occurs, party raises dispute' },
        { chain: 'Local Chain', action: '2. Bridge routes to Native chain' },
        { chain: 'Native Chain', action: '3. Native Athena.handleRaiseDispute() called' },
        { chain: 'Native Chain', action: '4. Increment job dispute counter, create dispute ID' },
        { chain: 'Native Chain', action: '5. Store dispute in Genesis, start voting period' },
        { chain: 'Native Chain', action: '6. Eligible voters call vote() with their weighted votes' },
        { chain: 'Native Chain', action: '7. Native DAO verifies eligibility and calculates power' },
        { chain: 'Native Chain', action: '8. Votes recorded in Genesis with voter data' },
        { chain: 'Native Chain', action: '9. After voting period, anyone calls settleDispute()' },
        { chain: 'Native Chain', action: '10. Determine winner (votesFor vs votesAgainst)' },
        { chain: 'Native Chain', action: '11. Distribute fees proportionally to winning voters' },
        { chain: 'Native Chain', action: '12. Call NOWJC.releaseDisputedFunds() to winner' },
        { chain: 'Winner\'s Chain', action: '13. Winner receives funds via CCTP' }
      ]
    },
    {
      title: 'Weighted Voting Power Calculation',
      description: 'How vote weight is calculated from multiple sources',
      steps: [
        { chain: 'Native Chain', action: 'User calls vote()' },
        { chain: 'Native Chain', action: 'Native Athena calls canVote()' },
        { chain: 'Native Chain', action: 'Check Native DAO for active stake' },
        { chain: 'Native Chain', action: 'If stakeAmount >= minStakeRequired: eligible' },
        { chain: 'Native Chain', action: 'Else check NOWJC for earned tokens' },
        { chain: 'Native Chain', action: 'If earnedTokens >= minStakeRequired: eligible' },
        { chain: 'Native Chain', action: 'Calculate total power = (stake * duration) + earned' },
        { chain: 'Native Chain', action: 'Store vote with calculated weight' },
        { chain: 'Native Chain', action: 'Higher power = larger share of fees if win' }
      ]
    },
    {
      title: 'Proportional Fee Distribution Flow',
      description: 'How fees are distributed based on voting power',
      steps: [
        { chain: 'Native Chain', action: 'Dispute settled, winner determined' },
        { chain: 'Native Chain', action: 'Get all voters from Genesis' },
        { chain: 'Native Chain', action: 'Calculate total power of winning side' },
        { chain: 'Native Chain', action: 'For each winning voter:' },
        { chain: 'Native Chain', action: '  voterShare = (totalFees * voterPower) / totalWinningPower' },
        { chain: 'Native Chain', action: '  Transfer USDC to voter\'s claim address' },
        { chain: 'Native Chain', action: 'Example: 100 USDC, 3 voters with 60%, 30%, 10% power' },
        { chain: 'Native Chain', action: '  Voter 1: 60 USDC, Voter 2: 30 USDC, Voter 3: 10 USDC' }
      ]
    }
  ],
  
  integrationGuide: {
    example: `// Complete Native Athena Integration Example
const { ethers } = require('ethers');

// Setup
const nativeAthena = new ethers.Contract(athenaAddress, athenaABI, signer);
const nativeDAO = new ethers.Contract(daoAddress, daoABI, signer);

// 1. Check voting eligibility
const canVote = await nativeAthena.canVote(userAddress);
const votingInfo = await nativeAthena.getUserVotingInfo(userAddress);

console.log("Can vote:", canVote);
console.log("Voting power:", votingInfo.totalVotingPower.toString());

// 2. Vote on dispute with weighted vote
const disputeId = "40232-57-1";
await nativeAthena.vote(
  0,  // VotingType.Dispute
  disputeId,
  true,  // Vote for dispute raiser
  userAddress  // Claim address
);

// 3. Check dispute status
const dispute = await nativeAthena.getDispute(disputeId);
console.log("Votes for:", dispute.votesFor.toString());
console.log("Votes against:", dispute.votesAgainst.toString());

// 4. Settle after voting period
const startTime = await nativeAthena.disputeStartTimes(disputeId);
const votingPeriod = await nativeAthena.votingPeriodMinutes();

if (Date.now() / 1000 >= startTime + (votingPeriod * 60)) {
  await nativeAthena.settleDispute(disputeId);
  console.log("Dispute settled");
}`,
    tips: [
      'Voting power = (stakeAmount * durationMinutes) + earnedTokens',
      'minStakeRequired defaults to 100 tokens (configurable by owner)',
      'votingPeriodMinutes defaults to 60 minutes (configurable)',
      'Fees distributed proportionally based on voting power contribution',
      'Multiple disputes per job supported with counter-based IDs',
      'Always provide valid claim address for fee rewards',
      'Check canVote() before attempting to vote',
      'settleDispute() can be called by anyone after voting period',
      'If no votes cast, fees refunded to dispute raiser',
      'Vote weight affects both outcome influence and fee share'
    ]
  },
  
  securityConsiderations: [
    'UUPS upgradeable - owner and bridge can upgrade implementation',
    'Voting eligibility verified through Native DAO integration',
    'Proportional fee distribution prevents gaming',
    'One vote per address per dispute/application',
    'Voting period enforced via timestamp checks',
    'Bridge access control for dispute creation (commented in code)',
    'Weighted voting based on stake duration and earned tokens',
    'All data stored in Genesis for upgrade persistence',
    'Fund release only after settlement and validation',
    'Fee refund mechanism if no community participation'
  ]
};
