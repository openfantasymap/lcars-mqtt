import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight section header / placeholder. Used to title areas of a station
 * console and to stand in for role-specific controls not yet built.
 *
 * Config: { type: 'panel', title: '...', note?: '...' }
 */
@Component({
  selector: 'lcars-panel',
  imports: [CommonModule],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit {

  @Input() configuration: any = {};

  constructor() { }

  ngOnInit(): void { }

}
