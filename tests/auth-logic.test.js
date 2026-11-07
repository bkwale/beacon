// Beacon auth-logic unit tests. Run: node --test
// Covers the pure validation + guard functions that gate login (BCN-ID-01..14).
const test = require("node:test");
const assert = require("node:assert/strict");
const A = require("../src/auth-logic.js");

test("normalizePhone adds a single leading +", () => {
  assert.equal(A.normalizePhone("2348012345678"), "+2348012345678");
  assert.equal(A.normalizePhone("+2348012345678"), "+2348012345678");
  assert.equal(A.normalizePhone(" +234 801 234 5678 "), "+2348012345678");
  assert.equal(A.normalizePhone("0801-234-5678"), "+08012345678"); // digits kept, + added
  assert.equal(A.normalizePhone(""), "");
  assert.equal(A.normalizePhone(null), "");
});

test("isValidPhone: 7–15 digits, optional +", () => {
  assert.ok(A.isValidPhone("+2348012345678"));
  assert.ok(A.isValidPhone("2348012345678"));
  assert.ok(A.isValidPhone("+44 7888 863411"));
  assert.ok(!A.isValidPhone("12345"));         // too short
  assert.ok(!A.isValidPhone("+12345678901234567")); // too long
  assert.ok(!A.isValidPhone("+234-abc-1234"));  // non-numeric
  assert.ok(!A.isValidPhone(""));
});

test("isValidEmail accepts well-formed, rejects junk", () => {
  assert.ok(A.isValidEmail("wale@techsanctum.org"));
  assert.ok(A.isValidEmail("beacon@beacon.techsanctum.org"));
  assert.ok(!A.isValidEmail("wale@"));
  assert.ok(!A.isValidEmail("wale.techsanctum.org"));
  assert.ok(!A.isValidEmail("a b@c.com"));
  assert.ok(!A.isValidEmail(""));
});

test("isValidPassword enforces 8+ chars", () => {
  assert.ok(A.isValidPassword("12345678"));
  assert.ok(A.isValidPassword("correct horse battery"));
  assert.ok(!A.isValidPassword("short7"));
  assert.ok(!A.isValidPassword(""));
  assert.ok(!A.isValidPassword(null));
});

test("isValidOtp: 4–8 digits only", () => {
  assert.ok(A.isValidOtp("123456"));
  assert.ok(A.isValidOtp("0000"));
  assert.ok(!A.isValidOtp("12"));
  assert.ok(!A.isValidOtp("123456789"));
  assert.ok(!A.isValidOtp("12 34"));
  assert.ok(!A.isValidOtp("abcd"));
});

test("isRealSession lets real users in, blocks anon/empty", () => {
  assert.ok(A.isRealSession({ user: { id: "u1", is_anonymous: false } }));
  assert.ok(A.isRealSession({ user: { id: "u1" } })); // no flag = real
  assert.ok(!A.isRealSession({ user: { id: "u1", is_anonymous: true } }));
  assert.ok(!A.isRealSession({ user: {} })); // no id
  assert.ok(!A.isRealSession(null));
  assert.ok(!A.isRealSession(undefined));
});

test("nextEmailMode toggles login <-> signup", () => {
  assert.equal(A.nextEmailMode("login"), "signup");
  assert.equal(A.nextEmailMode("signup"), "login");
});

test("isSmsNotConfigured recognises provider-missing errors", () => {
  assert.ok(A.isSmsNotConfigured("SMS provider is not enabled"));
  assert.ok(A.isSmsNotConfigured("Unsupported phone provider"));
  assert.ok(!A.isSmsNotConfigured("Invalid OTP token"));
});

test("isOtpInvalid recognises bad/expired codes", () => {
  assert.ok(A.isOtpInvalid("Token has expired"));
  assert.ok(A.isOtpInvalid("Invalid login credentials"));
  assert.ok(!A.isOtpInvalid("Network error"));
});
