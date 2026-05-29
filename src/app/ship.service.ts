import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConnectorService } from './connector.service';
import { AlertLevel, Ship, Stat, StatCommand } from './models/ship';

/**
 * Owns the fleet/ship telemetry. Mirrors IssueService's single-writer model:
 *
 * - `{room}/ships` is a retained snapshot of `Ship[]`, written ONLY by Master.
 * - Stations subscribe and render; they `act` on stats by publishing a
 *   `StatCommand` to `{room}/ship/cmd`, which Master applies and re-publishes.
 *
 * So the board stays race-free and late-joining stations get current state for
 * free — at the cost of requiring a Master to be connected (it's a GM tool).
 */
@Injectable({
  providedIn: 'root'
})
export class ShipService {
  ships: Ship[] = [];
  shipsChange: EventEmitter<Ship[]> = new EventEmitter<Ship[]>();

  master = false;

  private setupRoom: string | undefined;
  private received = false;
  /** Once Master starts authoring, ignore echoed board snapshots to avoid clobbering edits. */
  private authored = false;

  constructor(
    private c: ConnectorService,
    private h: HttpClient
  ) { }

  /** Wire subscriptions. `master=true` on the GM overview (the sole writer). */
  setup(room: string, master = false) {
    this.master = master;

    if (this.setupRoom === room) {
      return;
    }
    this.setupRoom = room;

    this.c.observeJson<Ship[]>('ships').subscribe(board => {
      // Master ignores its own echoes once it's editing.
      if (this.master && this.authored) {
        return;
      }
      this.ships = Array.isArray(board) ? board : [];
      this.received = true;
      this.shipsChange.emit(this.ships);
    });

    if (this.master) {
      // Commit player stat actions onto the authoritative board.
      this.c.observeJson<StatCommand>('ship/cmd').subscribe(cmd => this.applyCommand(cmd));

      // Seed from assets only if no retained board already exists for this room.
      // Defer briefly so an existing retained board (which arrives on subscribe)
      // always wins the race and we never clobber a live session on reconnect.
      this.h.get<Ship[]>('/assets/ships.json').subscribe(seed => {
        if (!Array.isArray(seed)) {
          return;
        }
        setTimeout(() => {
          if (!this.received && this.ships.length === 0) {
            this.ships = seed;
            this.commit();
          }
        }, 500);
      });
    }
  }

  // --- Master-side authoring (board writer) ---------------------------------

  addShip(name = 'New Ship'): Ship {
    const ship: Ship = { id: this.genId(), name, registry: '', alert: 'default', stats: [] };
    this.ships = [...this.ships, ship];
    this.commit();
    return ship;
  }

  removeShip(id: string) {
    this.ships = this.ships.filter(s => s.id !== id);
    this.commit();
  }

  setAlert(shipId: string, alert: AlertLevel) {
    const ship = this.find(shipId);
    if (ship) {
      ship.alert = alert;
      this.commit();
    }
  }

  addStat(shipId: string, stat: Stat) {
    const ship = this.find(shipId);
    if (!ship) {
      return;
    }
    // Ensure a unique key on the ship.
    let key = stat.key || 'stat';
    const base = key;
    let n = 1;
    while (ship.stats.some(s => s.key === key)) {
      key = `${base}-${n++}`;
    }
    ship.stats = [...ship.stats, { ...stat, key }];
    this.commit();
  }

  removeStat(shipId: string, key: string) {
    const ship = this.find(shipId);
    if (ship) {
      ship.stats = ship.stats.filter(s => s.key !== key);
      this.commit();
    }
  }

  /** Publish the whole fleet as a retained snapshot (Master only). */
  commit() {
    if (!this.master) {
      return;
    }
    this.authored = true;
    this.shipsChange.emit(this.ships);
    this.c.publishJson('ships', this.ships, { qos: 1, retain: true });
  }

  // --- Station-side action: send mutations for Master to commit -------------

  /** Player sets a stat to an explicit value. */
  setStat(shipId: string, key: string, value: number | string | boolean) {
    if (this.master) {
      const s = this.find(shipId)?.stats.find(x => x.key === key);
      if (s) {
        s.value = value;
        this.commit();
      }
      return;
    }
    this.sendCommand({ shipId, key, op: 'set', value, at: Date.now() });
  }

  /** Player nudges a numeric stat up/down (Master clamps to [0,max]). */
  adjustStat(shipId: string, key: string, delta: number) {
    if (this.master) {
      this.applyCommand({ shipId, key, op: 'delta', delta, at: Date.now() });
      return;
    }
    this.sendCommand({ shipId, key, op: 'delta', delta, at: Date.now() });
  }

  private sendCommand(cmd: StatCommand) {
    this.c.publishJson('ship/cmd', cmd, { qos: 1 });
  }

  private applyCommand(cmd: StatCommand) {
    if (!cmd || !cmd.shipId) {
      return;
    }
    const s = this.find(cmd.shipId)?.stats.find(x => x.key === cmd.key);
    if (!s) {
      return;
    }
    if (cmd.op === 'delta') {
      let nv = (Number(s.value) || 0) + Number(cmd.delta || 0);
      if (s.max != null) {
        nv = Math.max(0, Math.min(Number(s.max), nv));
      }
      s.value = nv;
    } else {
      if (cmd.value !== undefined) {
        s.value = cmd.value;
      }
    }
    this.commit();
  }

  find(id: string): Ship | undefined {
    return this.ships.find(s => s.id === id);
  }

  private genId(): string {
    return 'ship-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }
}
