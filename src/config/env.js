// Centralized, fail-fast environment configuration.
// Every other module reads config from here instead of touching
// process.env directly - this keeps env access in one auditable place
// and makes it trivial to add new environments (staging/prod/etc.)
// without touching test code.

require('dotenv').config();

/**
 * Reads a required env var or throws a clear error immediately,
 * instead of letting tests fail later with a confusing "invalid URL"
 * or "cannot login" error deep inside a test.
 */
function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[config] Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in, or export it in CI.`
    );
  }
  return value;
}

function optionalBoolean(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw.toLowerCase() === 'true';
}

const env = {
  baseUrl: required('BASE_URL').replace(/\/+$/, ''),
  user: {
    email: required('TEST_USER_EMAIL'),
    password: required('TEST_USER_PASSWORD'),
  },
  headless: optionalBoolean('HEADLESS', true),
  ciMode: optionalBoolean('CI', false),
};

module.exports = { env };
