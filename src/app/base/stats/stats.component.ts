import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipService } from '../../ship.service';
import { Ship, Stat } from '../../models/ship';

/**
 * Station-side ship readout. Renders a ship's stats (gauges + values) from the
 * synced fleet. When `configuration.editable` is set, numeric stats get -/+
 * controls so the player can act on them; the change is sent over MQTT for the
 * Master to commit.
 *
 * Config: { type: 'stats', ship?: <shipId>, editable?: boolean, step?: number }
 * (omitting `ship` shows the first/primary ship in the fleet).
 */
@Component({
  selector: 'lcars-stats',
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {

  @Input() configuration: any = {};

  ship: Ship | undefined;

  constructor(public ships: ShipService) { }

  ngOnInit(): void {
    this.refresh();
    this.ships.shipsChange.subscribe(() => this.refresh());
  }

  private refresh() {
    const id = this.configuration && this.configuration.ship;
    this.ship = id ? this.ships.find(id) : this.ships.ships[0];
  }

  get stats(): Stat[] {
    return this.ship ? this.ship.stats : [];
  }

  get editable(): boolean {
    return !!(this.configuration && this.configuration.editable);
  }

  private get step(): number {
    return (this.configuration && this.configuration.step) || 5;
  }

  /** Numeric stats can be nudged by the player. */
  canAct(s: Stat): boolean {
    return this.editable && (s.max != null || typeof s.value === 'number');
  }

  adjust(s: Stat, dir: number) {
    if (this.ship) {
      this.ships.adjustStat(this.ship.id, s.key, dir * this.step);
    }
  }

  pct(s: Stat): number {
    const v = Number(s.value);
    const m = Number(s.max);
    if (!m || isNaN(v)) {
      return 0;
    }
    return Math.max(0, Math.min(100, (v / m) * 100));
  }

}
