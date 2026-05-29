import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService } from '../../issue.service';
import { Issue } from '../../models/issue';

/**
 * Station-side display of the open issues directed at this console (or the
 * whole crew). Manual issues are informational; auto issues self-resolve via
 * IssueService once the player's controls reach the target state.
 */
@Component({
  selector: 'lcars-issues',
  imports: [CommonModule],
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

}
