/*
 * Beacon — auth logic (pure, framework-free).
 * Single source of truth for client-side validation + guards, so the deployed
 * app (index.html) and the unit tests exercise exactly the same functions.
 *
 * UMD shim: usable as a browser <script> (attaches to window.BeaconAuth) and
 * as a CommonJS module (require) in Node for tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BeaconAuth = api;
})(typeof window !== "undefined" ? window : null, function () {
  // Strip spaces, brackets and dashes from a dialled number.
  function cleanPhone(raw) {
    return String(raw == null ? "" : raw).trim().replace(/[\s()\-]/g, "");
  }
  // Normalise to E.164-ish: ensure a single leading "+". Empty in -> empty out.
  function normalizePhone(raw) {
    var p = cleanPhone(raw);
    if (!p) return "";
    return p[0] === "+" ? p : "+" + p;
  }
  // 7–15 digits, optional leading "+".
  function isValidPhone(raw) {
    return /^\+?\d{7,15}$/.test(cleanPhone(raw));
  }
  function isValidEmail(e) {
    return /^\S+@\S+\.\S+$/.test(String(e == null ? "" : e).trim());
  }
  function isValidPassword(p) {
    return typeof p === "string" && p.length >= 8;
  }
  // SMS OTP codes: 4–8 digits.
  function isValidOtp(t) {
    return /^\d{4,8}$/.test(String(t == null ? "" : t).trim());
  }
  // A session we should let into the app: real (non-anonymous) user with an id.
  function isRealSession(s) {
    return !!(s && s.user && s.user.id && !s.user.is_anonymous);
  }
  // Email form toggle between "log in" and "create account".
  function nextEmailMode(m) {
    return m === "login" ? "signup" : "login";
  }
  // Error-message classifiers (map provider errors to friendly copy).
  function isSmsNotConfigured(msg) {
    return /sms|provider|not enabled|unsupported|disabled/i.test(String(msg || ""));
  }
  function isOtpInvalid(msg) {
    return /expired|invalid/i.test(String(msg || ""));
  }

  return {
    cleanPhone: cleanPhone,
    normalizePhone: normalizePhone,
    isValidPhone: isValidPhone,
    isValidEmail: isValidEmail,
    isValidPassword: isValidPassword,
    isValidOtp: isValidOtp,
    isRealSession: isRealSession,
    nextEmailMode: nextEmailMode,
    isSmsNotConfigured: isSmsNotConfigured,
    isOtpInvalid: isOtpInvalid
  };
});
