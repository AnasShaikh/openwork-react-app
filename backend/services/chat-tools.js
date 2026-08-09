'use strict';

const ADDRESS_PATTERN = '^0x[a-fA-F0-9]{40}$';
const JOB_ID_PATTERN = '^[0-9]+(?:-[0-9]+)?$';

const textProperty = (description, maxLength = 4000) => ({
  type: 'string',
  description,
  minLength: 1,
  maxLength,
});

const amountProperty = (description) => ({
  type: 'number',
  description,
  exclusiveMinimum: 0,
  maximum: 1000000000,
});

const jobIdProperty = {
  type: 'string',
  description: 'Canonical OpenWork job ID, for example 42161-24 or 30365-3.',
  pattern: JOB_ID_PATTERN,
};

function tool(name, description, properties, required = []) {
  return {
    toolSpec: {
      name,
      description,
      inputSchema: {
        json: {
          type: 'object',
          properties,
          required,
          additionalProperties: false,
        },
      },
    },
  };
}

const BEDROCK_TRANSACTION_TOOLS = [
  tool('postJob', 'Prepare a new job for review and wallet confirmation. Posting does not approve or transfer USDC.', {
    title: textProperty('Job title.', 160),
    budget: amountProperty('Total nominal job budget in USDC.'),
    description: textProperty('Job description and requirements.'),
    skills: { type: 'array', items: textProperty('One required skill.', 80), maxItems: 12 },
    milestones: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: {
        type: 'object',
        properties: {
          description: textProperty('Milestone description.', 500),
          amount: amountProperty('Milestone amount in USDC.'),
        },
        required: ['description', 'amount'],
        additionalProperties: false,
      },
    },
  }, ['title', 'budget', 'description']),
  tool('applyToJob', 'Prepare an application to an existing OpenWork job.', {
    jobId: jobIdProperty,
    proposal: textProperty('Application proposal.'),
    proposedAmount: amountProperty('Proposed amount in USDC.'),
  }, ['jobId', 'proposal']),
  tool('startJob', 'Open the canonical start-job review for a selected applicant. The review handles exact USDC balance and allowance checks.', {
    jobId: jobIdProperty,
    applicantAddress: { type: 'string', description: 'Selected applicant wallet address.', pattern: ADDRESS_PATTERN },
    useAppMilestones: { type: 'boolean', description: 'Whether to use the application milestones when the posting chain supports them.' },
  }, ['jobId', 'applicantAddress']),
  tool('submitWork', 'Prepare a work submission for an active job.', {
    jobId: jobIdProperty,
    workDetails: textProperty('Description of the completed work and deliverables.'),
  }, ['jobId', 'workDetails']),
  tool('releasePayment', 'Open the canonical release-payment review for a job milestone.', {
    jobId: jobIdProperty,
  }, ['jobId']),
  tool('raiseDispute', 'Open the dispute form for a job so the user can review evidence, oracle and fee details.', {
    jobId: jobIdProperty,
    reason: textProperty('Reason for the dispute.'),
  }, ['jobId', 'reason']),
  tool('createProfile', 'Prepare a basic OpenWork freelancer profile.', {
    name: textProperty('Public display name.', 120),
    skills: { type: 'array', items: textProperty('One skill.', 80), minItems: 1, maxItems: 20 },
    hourlyRate: amountProperty('Public hourly rate in USDC.'),
  }, ['name', 'skills', 'hourlyRate']),
  tool('startDirectContract', 'Open the direct-contract form with details prefilled for review.', {
    title: textProperty('Contract title.', 160),
    budget: amountProperty('Total budget in USDC.'),
    description: textProperty('Contract requirements.'),
    jobTaker: { type: 'string', description: 'Freelancer wallet address.', pattern: ADDRESS_PATTERN },
  }, ['title', 'budget', 'description', 'jobTaker']),
  tool('openMyJobs', 'Open the connected wallet profile job history.', {}, []),
  tool('openJob', 'Open one job detail page.', { jobId: jobIdProperty }, ['jobId']),
  tool('browseJobs', 'Open the public job marketplace.', {}, []),
  tool('viewApplications', 'Open all received applications for one posted job.', { jobId: jobIdProperty }, ['jobId']),
];

const TOOL_RULES = {
  postJob: { required: ['title', 'budget', 'description'], kind: 'transaction' },
  applyToJob: { required: ['jobId', 'proposal'], kind: 'transaction' },
  startJob: { required: ['jobId', 'applicantAddress'], kind: 'review' },
  submitWork: { required: ['jobId', 'workDetails'], kind: 'transaction' },
  releasePayment: { required: ['jobId'], kind: 'review' },
  raiseDispute: { required: ['jobId', 'reason'], kind: 'review' },
  createProfile: { required: ['name', 'skills', 'hourlyRate'], kind: 'transaction' },
  startDirectContract: { required: ['title', 'budget', 'description', 'jobTaker'], kind: 'review' },
  openMyJobs: { required: [], kind: 'navigation' },
  openJob: { required: ['jobId'], kind: 'navigation' },
  browseJobs: { required: [], kind: 'navigation' },
  viewApplications: { required: ['jobId'], kind: 'navigation' },
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value, maxLength = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanJobId(value) {
  const result = cleanString(String(value ?? ''), 80);
  return new RegExp(JOB_ID_PATTERN).test(result) ? result : null;
}

function cleanAddress(value) {
  const result = cleanString(value, 42);
  return new RegExp(ADDRESS_PATTERN).test(result) ? result : null;
}

function cleanAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 1000000000 ? number : null;
}

function validateToolUse(toolUse) {
  if (!toolUse || typeof toolUse.name !== 'string' || !TOOL_RULES[toolUse.name]) return null;
  if (!isPlainObject(toolUse.input)) return null;

  const rule = TOOL_RULES[toolUse.name];
  const input = toolUse.input;
  if (rule.required.some((field) => input[field] === undefined || input[field] === null || input[field] === '')) return null;

  let params;
  switch (toolUse.name) {
    case 'postJob': {
      const title = cleanString(input.title, 160);
      const description = cleanString(input.description);
      const budget = cleanAmount(input.budget);
      if (!title || !description || !budget) return null;
      const skills = Array.isArray(input.skills)
        ? input.skills.map((skill) => cleanString(skill, 80)).filter(Boolean).slice(0, 12)
        : [];
      const milestones = Array.isArray(input.milestones)
        ? input.milestones.slice(0, 12).map((milestone) => ({
            description: cleanString(milestone?.description, 500),
            amount: cleanAmount(milestone?.amount),
          })).filter((milestone) => milestone.description && milestone.amount)
        : [];
      if (Array.isArray(input.milestones) && milestones.length !== input.milestones.length) return null;
      if (milestones.length) {
        const milestoneTotal = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
        if (Math.abs(milestoneTotal - budget) > 0.000001) return null;
      }
      params = { title, budget, description, skills, ...(milestones.length ? { milestones } : {}) };
      break;
    }
    case 'applyToJob': {
      const jobId = cleanJobId(input.jobId);
      const proposal = cleanString(input.proposal);
      const proposedAmount = input.proposedAmount === undefined ? null : cleanAmount(input.proposedAmount);
      if (!jobId || !proposal || (input.proposedAmount !== undefined && !proposedAmount)) return null;
      params = { jobId, proposal, ...(proposedAmount ? { proposedAmount } : {}) };
      break;
    }
    case 'startJob': {
      const jobId = cleanJobId(input.jobId);
      const applicantAddress = cleanAddress(input.applicantAddress);
      if (!jobId || !applicantAddress) return null;
      params = { jobId, applicantAddress, useAppMilestones: input.useAppMilestones === true };
      break;
    }
    case 'submitWork': {
      const jobId = cleanJobId(input.jobId);
      const workDetails = cleanString(input.workDetails);
      if (!jobId || !workDetails) return null;
      params = { jobId, workDetails };
      break;
    }
    case 'releasePayment':
    case 'openJob':
    case 'viewApplications': {
      const jobId = cleanJobId(input.jobId);
      if (!jobId) return null;
      params = { jobId };
      break;
    }
    case 'raiseDispute': {
      const jobId = cleanJobId(input.jobId);
      const reason = cleanString(input.reason);
      if (!jobId || !reason) return null;
      params = { jobId, reason };
      break;
    }
    case 'createProfile': {
      const name = cleanString(input.name, 120);
      const hourlyRate = cleanAmount(input.hourlyRate);
      const skills = Array.isArray(input.skills)
        ? input.skills.map((skill) => cleanString(skill, 80)).filter(Boolean).slice(0, 20)
        : [];
      if (!name || !hourlyRate || !skills.length) return null;
      params = { name, skills, hourlyRate };
      break;
    }
    case 'startDirectContract': {
      const title = cleanString(input.title, 160);
      const budget = cleanAmount(input.budget);
      const description = cleanString(input.description);
      const jobTaker = cleanAddress(input.jobTaker);
      if (!title || !budget || !description || !jobTaker) return null;
      params = { title, budget, description, jobTaker };
      break;
    }
    case 'openMyJobs':
    case 'browseJobs':
      params = {};
      break;
    default:
      return null;
  }

  const labels = {
    postJob: `Post “${params.title}” with a ${params.budget} USDC nominal budget`,
    applyToJob: `Apply to job ${params.jobId}`,
    startJob: `Review hiring ${params.applicantAddress} for job ${params.jobId}`,
    submitWork: `Submit work for job ${params.jobId}`,
    releasePayment: `Review milestone release for job ${params.jobId}`,
    raiseDispute: `Review a dispute for job ${params.jobId}`,
    createProfile: `Create the public profile “${params.name}”`,
    startDirectContract: `Review a direct contract with ${params.jobTaker}`,
    openMyJobs: 'Open my job history',
    openJob: `Open job ${params.jobId}`,
    browseJobs: 'Browse available jobs',
    viewApplications: `View applications for job ${params.jobId}`,
  };

  return {
    id: cleanString(toolUse.toolUseId, 128) || undefined,
    name: toolUse.name,
    kind: rule.kind,
    params,
    display: labels[toolUse.name],
    requiresWalletSignature: rule.kind === 'transaction',
  };
}

module.exports = {
  ADDRESS_PATTERN,
  BEDROCK_TRANSACTION_TOOLS,
  JOB_ID_PATTERN,
  TOOL_RULES,
  validateToolUse,
};
