import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConnectorService } from './connector.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lcars-mqtt';

  /** app-root IS the LCARS theme root; lcars-core reads these custom props. */
  @HostBinding('class.lcars') readonly lcarsRoot = true;

  @HostBinding('style.--lcars-primary')
  primaryColor = '#ffcc66';
  @HostBinding('style.--lcars-secondary')
  secondaryColor = '#99ccff';
  @HostBinding('style.--lcars-tertiary')
  tertiaryColor = '#cc99cc';

  /** Ship-wide alert condition: 'default' | 'alert_yellow' | 'alert_red' | 'alert_black'. */
  condition = 'default';

  constructor(
    private c: ConnectorService
  ) {
    this.c.settingsChange.subscribe(data => {
      if (data && data.style) {
        this.primaryColor = data.style.mainColor;
        this.secondaryColor = data.style.secondaryColor;
        this.tertiaryColor = data.style.tertiaryColor;
      }
    });
    this.c.conditionChange.subscribe(cond => {
      this.condition = cond || 'default';
    });
  }

  get inAlert(): boolean {
    return !!this.condition && this.condition !== 'default';
  }

  get alertLabel(): string {
    switch (this.condition) {
      case 'alert_red': return 'Red Alert';
      case 'alert_yellow': return 'Yellow Alert';
      case 'alert_black': return 'Black Alert';
      default: return '';
    }
  }
}
