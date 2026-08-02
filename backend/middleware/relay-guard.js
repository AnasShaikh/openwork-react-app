'use strict';

/**
 * Caps how many relay flows may be in flight at once.
 *
 * Each accepted relay request spawns a background task that watches the chain
 * for an event until EVENT_DETECTION_TIMEOUT (five minutes by default). The
 * endpoints are event-driven and the contracts enforce authorisation, so a
 * fabricated job id cannot move funds — but it can start a watcher that polls
 * an RPC provider for five minutes. Nothing previously bounded how many of those
 * could exist, so an unauthenticated caller could grow memory and RPC spend at
 * will.
 *
 * This is a ceiling, not a queue. Rejected callers get 503 and should retry;
 * legitimate volume never approaches the limit, because real flows are bounded
 * by how many jobs genuinely exist.
 */
const DEFAULT_MAX_IN_FLIGHT = Number(process.env.MAX_CONCURRENT_RELAY_FLOWS) || 50;

function boundInFlight(getInFlightCount, { max } = {}) {
  return (req, res, next) => {
    const ceiling = max || DEFAULT_MAX_IN_FLIGHT;
    const current = getInFlightCount();
    if (current >= ceiling) {
      console.warn(`Relay flow rejected: ${current} already in flight (cap ${ceiling})`);
      return res.status(503).json({
        success: false,
        error: 'Too many relay operations in progress. Retry shortly.',
        retryAfterSeconds: 30,
      });
    }
    return next();
  };
}

module.exports = { boundInFlight, DEFAULT_MAX_IN_FLIGHT };
