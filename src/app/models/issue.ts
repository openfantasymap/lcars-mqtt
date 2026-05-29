/**
 * Domain model for GM-authored "issues" — problems/challenges the Game Master
 * poses to a single station or the whole crew, resolved either manually by the
 * GM or automatically when a player's console reaches a target state.
 *
 * The authoritative board lives on the retained MQTT topic `{room}/issues`,
 * written only by the Master view. See IssueService for the lifecycle.
 */

/** Target value meaning "every station in the room". */
export const BROADCAST = '*';

export type IssueStatus = 'open' | 'resolved' | 'failed' | 'cancelled';

/** How an issue gets resolved. */
export type ResolutionMode =
  /** GM watches and clicks resolve. */
  | 'manual'
  /** Auto-resolves when the player's console state matches `condition`. */
  | 'auto';

/** Drives the LCARS colour of the issue and, optionally, the ship alert. */
export type Severity = 'info' | 'yellow' | 'red' | 'black';

/**
 * Auto-resolution condition: a map of io-topic (a widget's `emit` suffix) to
 * the value that topic must hold. ALL entries must match (deep equality) for
 * the issue to auto-resolve.
 *
 * Value semantics by widget: toggle -> boolean status, button -> `true` (or its
 * configured value), nav -> direction string.
 */
export interface AutoCondition {
  match: Record<string, any>;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  /** Station id, or BROADCAST ('*') for the whole crew. */
  target: string;
  mode: ResolutionMode;
  /** Required when mode === 'auto'. */
  condition?: AutoCondition;
  severity: Severity;
  status: IssueStatus;
  createdAt: number;
  resolvedAt?: number;
  /** Station id that resolved it, or 'gm'. */
  resolvedBy?: string;
  /** Id of the preset this was instantiated from, if any. */
  presetId?: string;
}

/** A reusable template the GM can trigger from the preset library. */
export interface IssuePreset {
  id: string;
  title: string;
  description: string;
  /** Pre-filled target; GM can override at injection time. */
  defaultTarget?: string;
  mode: ResolutionMode;
  condition?: AutoCondition;
  severity?: Severity;
}

/** Published by a station to `{room}/issues/resolution`; committed by Master. */
export interface ResolutionReport {
  issueId: string;
  station: string;
  op: 'resolve' | 'fail';
  at: number;
}
