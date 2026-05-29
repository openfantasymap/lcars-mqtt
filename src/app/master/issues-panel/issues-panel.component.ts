import { Component, OnInit } from '@angular/core';
import { IssueService } from '../../issue.service';
import { ConnectorService } from '../../connector.service';
import { BROADCAST, Issue, IssuePreset } from '../../models/issue';

interface CondPair {
  key: string;
  value: string;
}

/**
 * GM control surface for issues: the live board (with resolve/fail/cancel),
 * the preset library (one click pre-fills the form), and a free-form authoring
 * form including a key=value success-condition editor for auto issues.
 */
@Component({
  selector: 'lcars-issues-panel',
  templateUrl: './issues-panel.component.html',
  styleUrls: ['./issues-panel.component.scss']
})
export class IssuesPanelComponent implements OnInit {

  BROADCAST = BROADCAST;

  draft: Partial<Issue> = this.blankDraft();
  cond: CondPair[] = [];

  constructor(
    public issues: IssueService,
    public c: ConnectorService
  ) { }

  ngOnInit(): void { }

  /** Known station ids the GM can target (from global settings). */
  get stations(): string[] {
    return (this.c.settings && this.c.settings.sources) || [];
  }

  get open(): Issue[] {
    return this.issues.issues.filter(i => i.status === 'open');
  }

  get closed(): Issue[] {
    return this.issues.issues.filter(i => i.status !== 'open');
  }

  blankDraft(): Partial<Issue> {
    return { title: '', description: '', target: BROADCAST, mode: 'manual', severity: 'info' };
  }

  addCond() {
    this.cond.push({ key: '', value: 'true' });
  }

  removeCond(i: number) {
    this.cond.splice(i, 1);
  }

  /** Pre-fill the authoring form from a preset (editable before injecting). */
  loadPreset(p: IssuePreset) {
    this.draft = {
      title: p.title,
      description: p.description,
      target: p.defaultTarget || BROADCAST,
      mode: p.mode,
      severity: p.severity || 'info',
      presetId: p.id
    };
    this.cond = [];
    if (p.condition) {
      const m = p.condition.match;
      this.cond = Object.keys(m).map(k => ({ key: k, value: JSON.stringify(m[k]) }));
    }
  }

  create() {
    const partial: Partial<Issue> = { ...this.draft };
    if (this.draft.mode === 'auto') {
      const match: Record<string, any> = {};
      for (const p of this.cond) {
        if (p.key) {
          match[p.key] = this.parseValue(p.value);
        }
      }
      partial.condition = { match };
    } else {
      partial.condition = undefined;
    }
    this.issues.createIssue(partial);
    this.draft = this.blankDraft();
    this.cond = [];
  }

  private parseValue(v: string): any {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }

  resolve(i: Issue) { this.issues.resolveIssue(i.id); }
  fail(i: Issue) { this.issues.failIssue(i.id); }
  cancel(i: Issue) { this.issues.cancelIssue(i.id); }
  clear() { this.issues.clearResolved(); }
}
