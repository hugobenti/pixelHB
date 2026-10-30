import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import type { TShareMethod } from "@/features/shared/artwork/shareImage.type";
import type { TSyncErrorKind } from "@/features/shared/sync/sync.type";

/** The visitor's stored analytics choice; `null` until they pick one. */
export type TAnalyticsConsent = "granted" | "denied" | null;

/**
 * Every product event and its properties. Properties never carry artwork names, pixel data,
 * palettes or error text.
 */
export interface IAnalyticsEvents {
  artwork_created: { width: number; height: number };
  artwork_opened: Record<string, never>;
  export_png: { scale: TExportScale; credit: boolean };
  share: { method: TShareMethod; scale: TExportScale; credit: boolean };
  export_json: Record<string, never>;
  import_json: Record<string, never>;
  sign_in_started: Record<string, never>;
  sync_error: { kind: TSyncErrorKind };
}

export type TAnalyticsEventName = keyof IAnalyticsEvents;

/** The part of the PostHog client the controller drives (posthog-js satisfies it). */
export interface IAnalyticsClient {
  capture(event: string, properties?: Record<string, unknown>): unknown;
  has_opted_out_capturing(): boolean;
  opt_in_capturing(options?: { captureEventName?: string | null | false }): void;
  opt_out_capturing(): void;
  reset(): void;
  startSessionRecording(): void;
  stopSessionRecording(): void;
}

/** Where the choice is kept (localStorage in the browser). */
export interface IConsentStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface IAnalyticsControllerDeps {
  /** PostHog project token; empty or missing turns analytics off entirely. */
  token: string | undefined;
  storage: IConsentStorage;
  /** Loads and initialises PostHog with the token; called at most once, and only after consent. */
  load(token: string): Promise<IAnalyticsClient>;
}

export interface IAnalyticsController {
  /** False without a token: no banner, no script, every call a no-op. */
  readonly enabled: boolean;
  getConsent(): TAnalyticsConsent;
  setConsent(choice: "granted" | "denied"): void;
  /** Call once on app start: loads PostHog when consent was already granted. */
  start(): void;
  capture<E extends TAnalyticsEventName>(
    event: E,
    ...properties: IAnalyticsEvents[E] extends Record<string, never> ? [] : [IAnalyticsEvents[E]]
  ): void;
  subscribe(listener: () => void): () => void;
  /** Resolves once a pending PostHog load has settled, after the captures queued on it. */
  ready(): Promise<void>;
}

/** Where a request under /ingest is forwarded. */
export interface IIngestTarget {
  url: URL;
  headers: Headers;
}
