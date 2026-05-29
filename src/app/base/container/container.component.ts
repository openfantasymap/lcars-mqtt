import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';
import { ButtonComponent } from '../button/button.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { IssuesComponent } from '../issues/issues.component';
import { StatsComponent } from '../stats/stats.component';
import { PanelComponent } from '../panel/panel.component';

@Component({
  selector: 'lcars-container',
  imports: [
    CommonModule,
    NavComponent,
    ButtonComponent,
    ToggleComponent,
    IssuesComponent,
    StatsComponent,
    PanelComponent,
    ContainerComponent
  ],
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent implements OnInit {

  @Input() configuration: any;

  constructor() { }

  ngOnInit(): void {
  }

}
