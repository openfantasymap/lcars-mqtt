import { Component, OnInit } from '@angular/core';
import { ShipService } from '../../ship.service';
import { Ship } from '../../models/ship';

/**
 * GM overview: edit the whole fleet — ships, alert level, and a free-form table
 * of stats. Every edit republishes the retained `{room}/ships` board, so all
 * station fronts update live.
 */
@Component({
  selector: 'lcars-ship-overview',
  templateUrl: './ship-overview.component.html',
  styleUrls: ['./ship-overview.component.scss']
})
export class ShipOverviewComponent implements OnInit {

  /** Per-ship "new stat label" input buffer. */
  newStat: Record<string, string> = {};

  constructor(public ships: ShipService) { }

  ngOnInit(): void { }

  addStat(ship: Ship) {
    const label = (this.newStat[ship.id] || '').trim();
    if (!label) {
      return;
    }
    this.ships.addStat(ship.id, {
      key: this.slug(label),
      label,
      value: 100,
      max: 100,
      unit: '%',
      kind: 'gauge'
    });
    this.newStat[ship.id] = '';
  }

  /** GM edited an input directly on a bound ship/stat object — republish. */
  commit() {
    this.ships.commit();
  }

  private slug(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'stat';
  }
}
