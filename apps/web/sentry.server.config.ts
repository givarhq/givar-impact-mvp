// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cd5ed77e6be12f9702a06d6bd0cfd8ec@o4510943511314432.ingest.de.sentry.io/4511005820584016",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Logic: Ignore harmless network drops caused by hard browser navigations
  ignoreErrors: [
    "Connection closed.",
    "Request aborted",
    "Network Error",
    "ECONNABORTED"
  ],
});
