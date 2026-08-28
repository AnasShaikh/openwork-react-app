const EVM_ADDRESS = /0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/;
const DIRECT_CONTRACT_LANGUAGE = /\bdirect\s+(?:contract|job)\b/i;
const JOB_TAKER_LANGUAGE = /\b(?:job\s*taker|freelancer|recipient)\b/i;

export function getOppyActionSemanticConflict(tool) {
  if (!tool || tool.name !== 'postJob') return null;
  const title = String(tool.params?.title || '');
  const description = String(tool.params?.description || '');
  const text = `${title}\n${description}`;
  const namedJobTaker = EVM_ADDRESS.test(String(tool.params?.jobTaker || ''));
  if (namedJobTaker || (EVM_ADDRESS.test(text)
    && (DIRECT_CONTRACT_LANGUAGE.test(text) || JOB_TAKER_LANGUAGE.test(text)))) {
    return 'This review contains a named direct-contract recipient but was encoded as a marketplace job post.';
  }
  return null;
}

export function assertOppyActionSemantics(tool) {
  const conflict = getOppyActionSemanticConflict(tool);
  if (conflict) throw new Error(`${conflict} No wallet request was opened.`);
  return tool;
}
