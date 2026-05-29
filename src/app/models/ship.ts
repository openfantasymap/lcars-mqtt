/**
 * Ship telemetry model. The GM edits a fleet of ships in the overview panel;
 * the fleet is synced to every station as a retained MQTT snapshot on
 * `{room}/ships` (Master is the sole writer). Players can act on stats from
 * their consoles by sending mutation commands to `{room}/ship/cmd`, which the
 * Master applies back onto the board.
 */

export type AlertLevel = 'default' | 'yellow' | 'red' | 'black';

/** How a stat is rendered/edited. A `max` implies a gauge. */
export type StatKind = 'gauge' | 'number' | 'text' | 'state';

export interface Stat {
  key: string;
  label: string;
  value: number | string | boolean;
  /** Present => render as a gauge / percentage and clamp adjustments to [0,max]. */
  max?: number;
  unit?: string;
  kind?: StatKind;
}

export interface Ship {
  id: string;
  name: string;
  registry?: string;
  alert?: AlertLevel;
  stats: Stat[];
}

/** A player-side request to change a stat, committed by the Master. */
export interface StatCommand {
  shipId: string;
  key: string;
  op: 'set' | 'delta';
  /** for op==='set' */
  value?: number | string | boolean;
  /** for op==='delta' */
  delta?: number;
  at: number;
}
