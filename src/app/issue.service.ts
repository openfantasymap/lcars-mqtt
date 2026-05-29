import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConnectorService } from './connector.service';
import {
  BROADCAST,
  Issue,
  IssuePreset,
  ResolutionReport
} from './models/issue';

/**
 * Owns the GM "issue" lifecycle on top of ConnectorService's MQTT transport.
 *
 * The board is a single retained snapshot on `{room}/issues`, written ONLY by
 * the Master view (the GM is the authority). Stations subscribe and render
 * their slice, and self-report auto-resolutions to `{room}/issues/resolution`,
 * which the Master commits back onto the board. This single-writer rule is what
 * keeps the board race-free; auto-resolution requires a Master to be connected.
 */
@Injectable({
  providedIn: 'root'
})
export class IssueService {
  /** The authoritative board (mirrors `{room}/issues`). */
  issues: Issue[] = [];
  /** Preset library (from /assets/issues.json, optionally overridden over MQTT). */
  presets: IssuePreset[] = [];
  /** This station's latest control values, keyed by widget `emit`. */
  localState: Record<string, any> = {};

  issuesChange: EventEmitter<Issue[]> = new EventEmitter<Issue[]>();
  presetsChange: EventEmitter<IssuePreset[]> = new EventEmitter<IssuePreset[]>();

  /** true on the GM/Master view (the sole board writer). */
  master = false;
  station: string | undefined;

  private setupRoom: string | undefined;
  /** Auto-issues already reported by this station, to avoid duplicate reports. */
  private reported = new Set<string>();
  /** Last ship-wide condition published, to avoid redundant `{room}/global` writes. */
  private lastAlert: string | undefined;

  constructor(
    private c: ConnectorService,
    private h: HttpClient
  ) { }

  /**
   * Wire up subscriptions for a room. Pass a `station` for a player console;
   * omit it (master=true) for the GM control surface.
   */
  setup(room: string, station?: string) {
    this.master = !station;
    this.station = station;

    if (this.setupRoom === room) {
      return;
    }
    this.setupRoom = room;

    this.loadPresets();

    this.c.observeJson<Issue[]>('issues').subscribe(board => {
      this.issues = Array.isArray(board) ? board : [];
      this.issuesChange.emit(this.issues);
      if (!this.master) {
        this.evaluateAuto();
      }
    });

    this.c.observeJson<IssuePreset[]>('issues/presets').subscribe(presets => {
      if (Array.isArray(presets) && presets.length) {
        this.presets = presets;
        this.presetsChange.emit(this.presets);
      }
    });

    if (this.master) {
      this.c.observeJson<ResolutionReport>('issues/resolution').subscribe(report => {
        this.commitReport(report);
      });
    }
  }

  private loadPresets() {
    this.h.get<IssuePreset[]>('/assets/issues.json').subscribe(presets => {
      // Only seed if a live library hasn't already arrived over MQTT.
      if (!this.presets.length && Array.isArray(presets)) {
        this.presets = presets;
        this.presetsChange.emit(this.presets);
      }
    });
  }

  // --- Master-side: author + adjudicate (board writer) ----------------------

  /** Create an issue from a partial spec and publish the updated board. */
  createIssue(partial: Partial<Issue>): Issue {
    const issue: Issue = {
      id: this.genId(),
      title: partial.title || 'Issue',
      description: partial.description || '',
      target: partial.target || BROADCAST,
      mode: partial.mode || 'manual',
      condition: partial.condition,
      severity: partial.severity || 'info',
      status: 'open',
      createdAt: Date.now(),
      presetId: partial.presetId
    };
    this.issues = [...this.issues, issue];
    this.publishBoard();
    return issue;
  }

  /** Instantiate an issue from a preset, with optional GM overrides. */
  createFromPreset(presetId: string, overrides: Partial<Issue> = {}): Issue | undefined {
    const p = this.presets.find(x => x.id === presetId);
    if (!p) {
      return undefined;
    }
    return this.createIssue({
      title: p.title,
      description: p.description,
      target: p.defaultTarget,
      mode: p.mode,
      condition: p.condition,
      severity: p.severity,
      presetId: p.id,
      ...overrides
    });
  }

  resolveIssue(id: string, by: string = 'gm') {
    this.setStatus(id, 'resolved', by);
  }

  failIssue(id: string, by: string = 'gm') {
    this.setStatus(id, 'failed', by);
  }

  cancelIssue(id: string) {
    this.setStatus(id, 'cancelled', 'gm');
  }

  /** Drop resolved/failed/cancelled issues from the board. */
  clearResolved() {
    this.issues = this.issues.filter(i => i.status === 'open');
    this.publishBoard();
  }

  private setStatus(id: string, status: Issue['status'], by?: string) {
    let changed = false;
    this.issues = this.issues.map(i => {
      if (i.id !== id || i.status !== 'open') {
        return i;
      }
      changed = true;
      return { ...i, status, resolvedAt: Date.now(), resolvedBy: by };
    });
    if (changed) {
      this.publishBoard();
    }
  }

  /** Apply a station's resolution report onto the board (Master only). */
  private commitReport(report: ResolutionReport) {
    if (!report || !report.issueId) {
      return;
    }
    this.setStatus(report.issueId, report.op === 'fail' ? 'failed' : 'resolved', report.station);
  }

  /** Republish the whole board as a retained snapshot. */
  private publishBoard() {
    this.issuesChange.emit(this.issues);
    this.c.publishJson('issues', this.issues, { qos: 1, retain: true });
    this.syncAlert();
  }

  /**
   * Drive the ship-wide alert from the highest-severity OPEN issue, so creating
   * a red issue puts every screen on red alert and resolving it stands down.
   * (`info` issues don't raise an alert.) Master only; deduped so we publish
   * `{room}/global` only when the effective condition changes.
   */
  private syncAlert() {
    if (!this.master) {
      return;
    }
    const rank: Record<string, number> = { info: 0, yellow: 1, black: 2, red: 3 };
    const conditionFor: Record<string, string> = {
      yellow: 'alert_yellow',
      red: 'alert_red',
      black: 'alert_black'
    };
    let top: string | null = null;
    for (const i of this.issues) {
      if (i.status !== 'open' || i.severity === 'info') {
        continue;
      }
      if (!top || rank[i.severity] > rank[top]) {
        top = i.severity;
      }
    }
    const condition = top ? conditionFor[top] : 'default';
    if (condition !== this.lastAlert) {
      this.lastAlert = condition;
      this.c.shipCondition({ status: condition });
    }
  }

  // --- Station-side: report control state + auto-resolve --------------------

  /** Record a control value and re-evaluate any auto-issues for this station. */
  reportLocalState(emit: string, value: any) {
    if (!emit) {
      return;
    }
    this.localState[emit] = value;
    this.evaluateAuto();
  }

  /** Self-report any auto-issue whose condition is now satisfied. */
  private evaluateAuto() {
    if (this.master || !this.station) {
      return;
    }
    for (const issue of this.issues) {
      if (issue.status !== 'open' || issue.mode !== 'auto' || !issue.condition) {
        continue;
      }
      if (!this.targetsMe(issue)) {
        continue;
      }
      if (this.reported.has(issue.id)) {
        continue;
      }
      if (this.conditionMet(issue.condition.match)) {
        this.reported.add(issue.id);
        const report: ResolutionReport = {
          issueId: issue.id,
          station: this.station,
          op: 'resolve',
          at: Date.now()
        };
        this.c.publishJson('issues/resolution', report, { qos: 1 });
      }
    }
  }

  /** Issues visible to this station: targeted at it, or broadcast. */
  targetsMe(issue: Issue): boolean {
    return issue.target === BROADCAST || issue.target === this.station;
  }

  private conditionMet(match: Record<string, any>): boolean {
    return Object.keys(match).every(
      k => JSON.stringify(this.localState[k]) === JSON.stringify(match[k])
    );
  }

  private genId(): string {
    return 'iss-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }
}
