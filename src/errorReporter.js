/**
 * Automated Client-to-Server Error Reporter Bridge
 * Captures browser unhandled exceptions, Promise rejections, and console.error/warn,
 * and transmits them directly to the backend server logs (/api/client-error).
 */
(function() {
  if (window.__leelioErrorReporterInitialized) return;
  window.__leelioErrorReporterInitialized = true;

  const ENDPOINT = '/api/client-error';
  const sentCache = new Map(); // messageKey -> timestamp
  const THROTTLE_MS = 2500;
  let totalErrorsSent = 0;
  const MAX_ERRORS_PER_SESSION = 100;

  function reportError(type, message, details = {}) {
    if (totalErrorsSent >= MAX_ERRORS_PER_SESSION) return;

    const msgStr = typeof message === 'string' ? message : (message && message.message ? message.message : String(message));
    const dedupeKey = `${type}:${msgStr}:${details.source || ''}:${details.lineno || ''}`;

    const now = Date.now();
    const lastSent = sentCache.get(dedupeKey) || 0;
    if (now - lastSent < THROTTLE_MS) {
      return; // Deduplicated
    }
    sentCache.set(dedupeKey, now);
    totalErrorsSent++;

    const payload = {
      type: type,
      page: window.location.pathname,
      message: msgStr,
      source: details.source || '',
      lineno: details.lineno || 0,
      colno: details.colno || 0,
      stack: details.stack || (message && message.stack ? message.stack : ''),
      userAgent: navigator.userAgent,
      time: new Date().toISOString()
    };

    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        const success = navigator.sendBeacon(ENDPOINT, blob);
        if (!success) {
          fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
        }
      } else {
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
      }
    } catch (e) {
      // Avoid recursive loops
    }
  }

  // 1. Unhandled Window Errors (Syntax, Reference, Type errors)
  window.addEventListener('error', function(event) {
    reportError('uncaught_error', event.message, {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : ''
    });
  });

  // 2. Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
    reportError('unhandled_rejection', msg, {
      stack: reason && reason.stack ? reason.stack : ''
    });
  });

  // 3. Intercept console.error
  const origConsoleError = console.error;
  console.error = function(...args) {
    try {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      reportError('console_error', msg);
    } catch (_) {}
    origConsoleError.apply(console, args);
  };

  // 4. Intercept critical console.warn (specifically THREE.js warnings like NaN or BufferGeometry)
  const origConsoleWarn = console.warn;
  console.warn = function(...args) {
    try {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (msg.includes('THREE.') || msg.includes('NaN') || msg.includes('WebGL') || msg.includes('AudioContext')) {
        reportError('console_warn', msg);
      }
    } catch (_) {}
    origConsoleWarn.apply(console, args);
  };

  console.log('[ErrorReporter] Automated client-to-server error telemetry active.');
})();
