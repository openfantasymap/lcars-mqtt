import { Component, Input, OnInit } from '@angular/core';
import {
  LcarsBarComponent,
  LcarsGaugeComponent,
  LcarsReadoutComponent,
  LcarsRowComponent,
  LcarsButtonComponent
} from '@openfantasymap/lcars-ngx';
import { ShipService } from '../../ship.service';
import { Ship, Stat } from '../../models/ship';

/**
 * Station-side ship readout built from lcars-ngx primitives (gauge/readout/bar).
 * When `configuration.editable`, numeric stats get −/+ controls that send a
 * StatCommand over MQTT for the Master to commit.
 *
 * Config: { type: 'stats', ship?: <shipId>, editable?: boolean, step?: number }
 */
@Component({
  selector: 'lcars-stats',
  imports: [LcarsBarComponent, LcarsGaugeComponent, LcarsReadoutComponent, LcarsRowComponent, LcarsButtonComponent],
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

  get shipTitle(): string {
    if (!this.ship) {
      return '';
    }
    return this.ship.registry ? `${this.ship.name}  ${this.ship.registry}` : this.ship.name;
  }

  get editable(): boolean {
    return !!(this.configuration && this.configuration.editable);
  }

  private get step(): number {
    return (this.configuration && this.configuration.step) || 5;
  }

  isNumeric(s: Stat): boolean {
    return s.max != null || typeof s.value === 'number';
  }

  num(s: Stat): number {
    return Number(s.value) || 0;
  }

  adjust(s: Stat, dir: number) {
    if (this.ship) {
      this.ships.adjustStat(this.ship.id, s.key, dir * this.step);
    }
  }

}
