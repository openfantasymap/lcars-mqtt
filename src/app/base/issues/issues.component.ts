import { Component, Input, OnInit } from '@angular/core';
import {
  LcarsBarComponent,
  LcarsPanelComponent,
  LcarsReadoutComponent,
  LcarsTextBoxComponent,
  LcarsIndicatorComponent,
  LcarsRowComponent
} from '@openfantasymap/lcars-ngx';
import { IssueService } from '../../issue.service';
import { Issue } from '../../models/issue';

/**
 * Station-side display of the open issues directed at this console (or the whole
 * crew), built from lcars-ngx primitives. Auto issues self-resolve via
 * IssueService once the player's controls reach the target state.
 */
@Component({
  selector: 'lcars-issues',
  imports: [
    LcarsBarComponent,
    LcarsPanelComponent,
    LcarsReadoutComponent,
    LcarsTextBoxComponent,
    LcarsIndicatorComponent,
    LcarsRowComponent
  ],
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.scss']
})
export class IssuesComponent implements OnInit {

  @Input() configuration: any;

  open: Issue[] = [];

  constructor(public issues: IssueService) { }

  ngOnInit(): void {
    this.refresh();
    this.issues.issuesChange.subscribe(() => this.refresh());
  }

  private refresh() {
    this.open = this.issues.issues.filter(
      i => i.status === 'open' && this.issues.targetsMe(i)
    );
  }

  /** Severity → lcars-core colour token. */
  severityColor(i: Issue): string {
    return { info: 'primary', yellow: 'warning', red: 'danger', black: 'lilac' }[i.severity] || 'primary';
  }

  /** Severity → lcars-indicator state. */
  severityState(i: Issue): string {
    return { info: 'online', yellow: 'standby', red: 'alert', black: 'offline' }[i.severity] || 'online';
  }

}
