import { Component, Input } from '@angular/core';
import {
  LcarsRowComponent,
  LcarsColumnComponent,
  LcarsPanelComponent,
  LcarsTextBoxComponent,
  LcarsButtonComponent,
  LcarsToggleComponent
} from '@openfantasymap/lcars-ngx';
import { ConnectorService } from '../../connector.service';
import { IssueService } from '../../issue.service';
import { NavComponent } from '../nav/nav.component';
import { IssuesComponent } from '../issues/issues.component';
import { StatsComponent } from '../stats/stats.component';

/**
 * Recursive JSON→component renderer. Switches on configuration.type and renders
 * lcars-ngx components; interaction is wired to MQTT here (the lib components are
 * presentational only). Structural nodes (row/column) recurse.
 */
@Component({
  selector: 'lcars-container',
  imports: [
    LcarsRowComponent,
    LcarsColumnComponent,
    LcarsPanelComponent,
    LcarsTextBoxComponent,
    LcarsButtonComponent,
    LcarsToggleComponent,
    NavComponent,
    IssuesComponent,
    StatsComponent,
    ContainerComponent
  ],
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent {

  @Input() configuration: any;

  constructor(
    public c: ConnectorService,
    public issues: IssueService
  ) { }

  /** Button press → publish its value (default true) to {room}/io/{emit}. */
  emit(node: any) {
    if (node && node.emit) {
      const v = node.value !== undefined ? node.value : true;
      this.c.publishIo(node.emit, v);
      this.issues.reportLocalState(node.emit, v);
    }
  }

  /** Toggle change → publish the boolean state. */
  emitToggle(node: any, checked: boolean) {
    if (node && node.emit) {
      this.c.publishIo(node.emit, checked);
      this.issues.reportLocalState(node.emit, checked);
    }
  }

  /** Current toggle state for a node, from the reported local console state. */
  toggleState(node: any): boolean {
    return !!(node && node.emit && this.issues.localState[node.emit]);
  }

}
