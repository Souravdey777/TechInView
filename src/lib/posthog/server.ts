import { PostHog } from "posthog-node";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let posthogServer: PostHog | null = null;

function getPostHogServer(): PostHog | null {
  if (!POSTHOG_KEY || POSTHOG_KEY === "phc_...") return null;

  if (!posthogServer) {
    posthogServer = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogServer;
}

export function captureServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogServer();
  if (!client) return;

  client.capture({
    distinctId: userId,
    event,
    properties,
  });
}

export function identifyServerUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogServer();
  if (!client) return;

  client.identify({
    distinctId: userId,
    properties,
  });
}

export async function shutdownPostHog() {
  if (posthogServer) {
    await posthogServer.shutdown();
    posthogServer = null;
  }
}
