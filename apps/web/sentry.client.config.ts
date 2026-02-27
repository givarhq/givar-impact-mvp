import * as Sentry from "@sentry/nextjs";

Sentry.init({
    // Logic: Ensure DSN is explicitly referenced from public env to be available in browser
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Force debug mode on to diagnose ingestion issues in the browser console
    debug: true,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});