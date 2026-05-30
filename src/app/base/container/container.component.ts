import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  LcarsRowComponent,
  LcarsColumnComponent,
  LcarsPanelComponent,
  LcarsTextBoxComponent,
  LcarsButtonComponent,
  LcarsToggleComponent,
  LcarsBarComponent,
  LcarsGaugeComponent,
  LcarsCompassComponent,
  LcarsHelmComponent,
  LcarsSliderComponent,
  LcarsBarGraphComponent,
  LcarsIndicatorComponent,
  LcarsReadoutComponent,
  LcarsAlertComponent,
  LcarsPowerRowComponent,
  LcarsWarpCoreComponent
} from '@openfantasymap/lcars-ngx';
import { ConnectorService } from '../../connector.service';
import { IssueService } from '../../issue.service';
import { NavComponent } from '../nav/nav.component';
import { IssuesComponent } from '../issues/issues.component';
import { StatsComponent } from '../stats/stats.component';

/**
 * Recursive JSON→component renderer. Structural nodes (row/column/panel) recurse;
 * command nodes (button/toggle/nav) publish to MQTT; display nodes (gauge/compass/
 * helm/…) read a live value from `{room}/io/{source}` (falling back to a static
 * `value`). The lcars-ngx components are presentational; binding/IO is wired here.
 */
@Component({
  selector: 'lcars-container',
  imports: [
    LcarsRowComponent, LcarsColumnComponent, LcarsPanelComponent, LcarsTextBoxComponent,
    LcarsButtonComponent, LcarsToggleComponent, LcarsBarComponent,
    LcarsGaugeComponent, LcarsCompassComponent, LcarsHelmComponent, LcarsSliderComponent,
    LcarsBarGraphComponent, LcarsIndicatorComponent, LcarsReadoutComponent, LcarsAlertComponent,
    LcarsPowerRowComponent, LcarsWarpCoreComponent,
    NavComponent, IssuesComponent, StatsComponent, ContainerComponent
  ],
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent implements OnInit, OnDestroy {

  @Input() configuration: any;

  /** Latest live value for a display node's `source` io topic. */
  live: any;
  private sub?: Subscription;

  constructor(
    public c: ConnectorService,
    public issues: IssueService
  ) { }

  ngOnInit(): void {
    const src = this.configuration && this.configuration.source;
    if (src) {
      this.sub = this.c.observeJson('io/' + src).subscribe((d: any) => {
        this.live = (d && d.value !== undefined) ? d.value : d;
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Resolved value for display nodes: live io value, else the static config value. */
  private value(): any {
    return this.live !== undefined && this.live !== null ? this.live : (this.configuration && this.configuration.value);
  }

  num(): number {
    const n = Number(this.value());
    return isNaN(n) ? 0 : n;
  }

  str(): string {
    const v = this.value();
    return v !== undefined && v !== null ? String(v) : '';
  }

  // --- command wiring (button/toggle/nav publish to MQTT) -------------------

  emit(node: any) {
    if (node && node.emit) {
      const v = node.value !== undefined ? node.value : true;
      this.c.publishIo(node.emit, v);
      this.issues.reportLocalState(node.emit, v);
    }
  }

  emitToggle(node: any, checked: boolean) {
    if (node && node.emit) {
      this.c.publishIo(node.emit, checked);
      this.issues.reportLocalState(node.emit, checked);
    }
  }

  toggleState(node: any): boolean {
    return !!(node && node.emit && this.issues.localState[node.emit]);
  }

}
