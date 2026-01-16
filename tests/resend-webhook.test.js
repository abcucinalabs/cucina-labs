const test = require("node:test")
const assert = require("node:assert/strict")
const crypto = require("node:crypto")

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
})
require("ts-node/register/transpile-only")

const {
  parseResendSignature,
  verifyResendSignature,
} = require("../lib/resend-webhook")

test("parseResendSignature parses timestamp and signature", () => {
  const parsed = parseResendSignature("t=1700000000,v1=abc123", "")
  assert.equal(parsed.signature, "abc123")
  assert.equal(parsed.signedTimestamp, "1700000000")
  assert.equal(parsed.timestamp, 1700000000 * 1000)
})

test("verifyResendSignature validates timestamped signature", () => {
  const rawBody = '{"event":"delivered"}'
  const secret = "shh"
  const timestamp = "1700000000"
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  const result = verifyResendSignature({
    rawBody,
    signatureHeader: `t=${timestamp},v1=${signature}`,
    secret,
    now: 1700000000 * 1000 + 1000,
  })

  assert.equal(result.ok, true)
})

test("verifyResendSignature rejects replayed timestamp", () => {
  const rawBody = '{"event":"opened"}'
  const secret = "shh"
  const timestamp = "1700000000"
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  const result = verifyResendSignature({
    rawBody,
    signatureHeader: `t=${timestamp},v1=${signature}`,
    secret,
    now: 1700000000 * 1000 + 6 * 60 * 1000,
  })

  assert.equal(result.ok, false)
  assert.equal(result.error, "timestamp_out_of_range")
})

test("verifyResendSignature validates legacy signature without timestamp", () => {
  const rawBody = '{"event":"sent"}'
  const secret = "shh"
  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  const result = verifyResendSignature({
    rawBody,
    signatureHeader: signature,
    secret,
  })

  assert.equal(result.ok, true)
})
