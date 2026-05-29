import { Component, Input, OnInit } from '@angular/core';
import {
  LcarsAppComponent,
  LcarsAppHeaderDirective,
  LcarsAppSidebarDirective,
  LcarsAppContentDirective,
  LcarsBarComponent,
  LcarsNavComponent,
  LcarsNavItemComponent
} from '@openfantasymap/lcars-ngx';
import { ConnectorService } from '../connector.service';
import { ContainerComponent } from '../base/container/container.component';

/**
 * LCARS app shell: header bar (title), sidebar tab rail, and the active tab's
 * content rendered through the recursive container. Built on lcars-ngx layout.
 */
@Component({
  selector: 'lcars-interface',
  imports: [
    LcarsAppComponent,
    LcarsAppHeaderDirective,
    LcarsAppSidebarDirective,
    LcarsAppContentDirective,
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

  get sidebar(): any[] {
    return (this.configuration && this.configuration.structure && this.configuration.structure.sidebar) || [];
  }

  get contentEntries(): { key: string; value: any }[] {
    const content = (this.configuration && this.configuration.structure && this.configuration.structure.content) || {};
    return Object.keys(content).map(k => ({ key: k, value: content[k] }));
  }

}
