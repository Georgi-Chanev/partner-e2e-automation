// Minimal structured logger. Playwright already captures traces/videos/
// screenshots on failure (see playwright.config.js), but a lightweight
// step-level log is invaluable when reading CI output without opening
// the HTML report - it lets you pinpoint *which* business step failed
// (e.g. "creating partner" vs "opening form") at a glance.

function timestamp() {
  return new Date().toISOString();
}

function format(level, scope, message, meta) {
  const base = `[${timestamp()}] [${level}] [${scope}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

function createLogger(scope) {
  return {
    step: (message, meta) => console.log(format('STEP', scope, message, meta)),
    info: (message, meta) => console.log(format('INFO', scope, message, meta)),
    warn: (message, meta) => console.warn(format('WARN', scope, message, meta)),
    error: (message, meta) => console.error(format('ERROR', scope, message, meta)),
  };
}

module.exports = { createLogger };
