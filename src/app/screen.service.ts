import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConnectorService } from './connector.service';

/**
 * Runtime registry of station "screens" (layout JSON keyed by id). The GM edits
 * screens in the Master; stations load them by id (the URL segment).
 *
 * Same single-writer-retained-board pattern as IssueService/ShipService:
 * `{room}/screens` is a retained snapshot written ONLY by the Master. Stations
 * read it via ConnectorService.setupStation (screens[id] overrides the
 * /assets/stations.json seed). Seeds itself from stations.json if no registry
 * exists yet, so the GM starts with the built-in roles to clone/mix-and-match.
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenService {
  /** screenId -> layout (station `form` shape). */
  screens: Record<string, any> = {};
  screensChange: EventEmitter<Record<string, any>> = new EventEmitter<Record<string, any>>();

  private setupRoom: string | undefined;
  private received = false;
  /** Once the GM starts editing, ignore echoed snapshots to avoid clobbering. */
  private authored = false;

  constructor(
    private c: ConnectorService,
    private h: HttpClient
  ) { }

  setup(room: string) {
    if (this.setupRoom === room) {
      return;
    }
    this.setupRoom = room;

    this.c.observeJson<Record<string, any>>('screens').subscribe(reg => {
      if (this.authored) {
        return;
      }
      this.screens = reg && typeof reg === 'object' ? reg : {};
      this.received = true;
      this.screensChange.emit(this.screens);
    });

    // Seed from the built-in role layouts if no registry exists for this room.
    // Deferred so an existing retained registry wins the race on reconnect.
    this.h.get<Record<string, any>>('/assets/stations.json').subscribe(seed => {
      if (!seed) {
        return;
      }
      setTimeout(() => {
        if (!this.received && Object.keys(this.screens).length === 0) {
          this.screens = seed;
          this.commit();
        }
      }, 500);
    });
  }

  ids(): string[] {
    return Object.keys(this.screens);
  }

  get(id: string): any {
    return this.screens[id];
  }

  saveScreen(id: string, layout: any) {
    this.screens = { ...this.screens, [id]: layout };
    this.commit();
  }

  deleteScreen(id: string) {
    const next = { ...this.screens };
    delete next[id];
    this.screens = next;
    this.commit();
  }

  /** Publish the registry as a retained snapshot. */
  commit() {
    this.authored = true;
    this.screensChange.emit(this.screens);
    this.c.publishJson('screens', this.screens, { qos: 1, retain: true });
  }
}
