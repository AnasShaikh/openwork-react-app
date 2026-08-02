'use strict';

const { Web3 } = require('web3');

const web3 = new Web3();

// A signature is accepted for five minutes. Long enough to tolerate clock skew
// and a slow upload, short enough that a captured header is not durable.
const SIGNATURE_TTL_MS = 5 * 60 * 1000;

/**
 * The message the client signs. Both sides must build this identically, so it is
 * exported rather than duplicated in the frontend.
 *
 * The address is included in the signed payload as well as the header so the two
 * cannot be varied independently.
 */
function buildAuthMessage(address, timestamp) {
  return [
    'OpenWork upload authorization',
    `address: ${String(address).toLowerCase()}`,
    `timestamp: ${timestamp}`,
  ].join('\n');
}

/**
 * Verifies that the caller controls the wallet they claim.
 *
 * This is deliberately not a login. There is no session and no account: the
 * caller signs a short-lived message and the recovered address becomes the
 * identity that upload quotas are charged against. That is the property we need
 * — attribution — without adding friction or state.
 *
 * Replay inside the five-minute window is possible. That is an accepted limit:
 * it bounds an attacker to reusing their own quota, which is the thing being
 * rationed anyway.
 */
function verifyWalletSignature(req) {
  const address = req.get('x-wallet-address');
  const signature = req.get('x-wallet-signature');
  const timestamp = req.get('x-wallet-timestamp');

  if (!address || !signature || !timestamp) {
    return { ok: false, status: 401, error: 'Wallet signature headers are missing' };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { ok: false, status: 400, error: 'Malformed wallet address' };
  }

  const signedAt = Number(timestamp);
  if (!Number.isFinite(signedAt)) {
    return { ok: false, status: 400, error: 'Malformed signature timestamp' };
  }

  // Reject both stale and future-dated signatures; a large positive skew would
  // otherwise extend the acceptance window indefinitely.
  if (Math.abs(Date.now() - signedAt) > SIGNATURE_TTL_MS) {
    return { ok: false, status: 401, error: 'Signature has expired; sign again' };
  }

  let recovered;
  try {
    recovered = web3.eth.accounts.recover(buildAuthMessage(address, signedAt), signature);
  } catch {
    return { ok: false, status: 401, error: 'Signature could not be verified' };
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return { ok: false, status: 401, error: 'Signature does not match the supplied address' };
  }

  return { ok: true, address: address.toLowerCase() };
}

/**
 * Express middleware form. Attaches `req.walletAddress` on success.
 *
 * Enforcement is opt-in via IPFS_REQUIRE_SIGNATURE so the backend can be deployed
 * before every frontend upload path has been migrated to sign its requests. When
 * disabled, a valid signature is still honoured and still sets req.walletAddress,
 * so quota accounting starts working for migrated callers immediately.
 */
function walletSignature({ required } = {}) {
  return (req, res, next) => {
    const enforce =
      required !== undefined
        ? required
        : process.env.IPFS_REQUIRE_SIGNATURE === 'true';

    const hasHeaders = Boolean(req.get('x-wallet-address'));

    if (!hasHeaders && !enforce) {
      req.walletAddress = null;
      return next();
    }

    const result = verifyWalletSignature(req);
    if (!result.ok) {
      if (!enforce) {
        // A malformed signature while unenforced is a client bug worth surfacing
        // in logs, but must not break an upload path that still works today.
        console.warn(`Wallet signature rejected (not enforced): ${result.error}`);
        req.walletAddress = null;
        return next();
      }
      return res.status(result.status).json({ success: false, error: result.error });
    }

    req.walletAddress = result.address;
    return next();
  };
}

module.exports = { walletSignature, verifyWalletSignature, buildAuthMessage, SIGNATURE_TTL_MS };
