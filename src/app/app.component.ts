import { Component, HostBinding } from '@angular/core';
import { ConnectorService } from './connector.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lcars-mqtt';

  @HostBinding("style.--main-color")
  private mainColor: string = "#ccddee";
  @HostBinding("style.--secondary-color")
  private secondaryColor: string = "#fc6";
  @HostBinding("style.--tertiary-color")
  private tertiaryColor: string = "#fc6";

  constructor(
    private c: ConnectorService
  ){
    this.c.settingsChange.subscribe(data=>{
      this.mainColor = data.style.mainColor;
      this.secondaryColor = data.style.secondaryColor;
      this.tertiaryColor = data.style.tertiaryColor;
    })
  }
}
