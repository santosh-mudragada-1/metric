import { PostHog } from 'posthog-node'

export interface PostHogEnv {
  POSTHOG_PROJECT_TOKEN?: string
  POSTHOG_HOST?: string
}

export function createPostHog(env: PostHogEnv): PostHog | null {
  if (!env.POSTHOG_PROJECT_TOKEN || !env.POSTHOG_HOST) return null

  return new PostHog(env.POSTHOG_PROJECT_TOKEN, {
    host: env.POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  })
}
