import { Component, Input, OnInit } from '@angular/core';
import {
  LcarsElbowComponent,
  LcarsBarComponent,
  LcarsNavComponent,
  LcarsNavItemComponent
} from '@openfantasymap/lcars-ngx';
import { ConnectorService } from '../connector.service';
import { ContainerComponent } from '../base/container/container.component';

/**
 * LCARS chrome. Two frame layouts (selected by `configuration.layout`):
 *  - 'sidebar' (default): top-left elbow + top bar + left nav rail + content.
 *  - 'frame': full left bracket — top elbow+bar, left rail, bottom elbow+bar.
 * Built from lcars-ngx primitives (elbow/bar/nav); content via the container.
 */
@Component({
  selector: 'lcars-interface',
  imports: [
    LcarsElbowComponent,
    LcarsBarComponent,
    LcarsNavComponent,
    LcarsNavItemComponent,
    ContainerComponent
  ],
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.scss']
})
export class InterfaceComponent implements OnInit {

  @Input() title: string | undefined = 'LCARS';
  @Input() footer: string | undefined = 'NCC-1701-D';
  @Input() configuration: any;

  active = 'main';

  constructor(
    private c: ConnectorService
  ) { }

  ngOnInit(): void {
    this.c.stationChange.subscribe(data => {
      this.configuration = data;
    });
  }

  do(tgt: any) {
    if (tgt && tgt.type === 'tab') {
      this.active = tgt.tab;
    }
  }

  /** Chrome layout: 'sidebar' (default) or 'frame'. */
  get layout(): string {
    return (this.configuration && this.configuration.layout) || 'sidebar';
  }

  get sidebar(): any[] {
    return (this.configuration && this.configuration.structure && this.configuration.structure.sidebar) || [];
  }

  get contentEntries(): { key: string; value: any }[] {
    const content = (this.configuration && this.configuration.structure && this.configuration.structure.content) || {};
    return Object.keys(content).map(k => ({ key: k, value: content[k] }));
  }

}
