import { Component, OnInit } from '@angular/core';
import { ConnectorService } from '../connector.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-station',
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss']
})
export class StationComponent implements OnInit {
  mode: string = "local";

  room: string|null = null;
  station: string|null = null;
  condition: string = "default";

  configuration: any;
  settings: any = {
    title: "LCARS"
  }

  constructor(
    private c: ConnectorService,
    private ar: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.c.setMode(this.mode);
    this.c.settingsChange.subscribe(data=>{
      this.settings=data;
    });
    this.c.stationChange.subscribe(data=>{
      this.configuration = data;
    })

    this.c.conditionChange.subscribe(data=>{
      this.condition = data;
    });
    this.ar.paramMap.subscribe(d=>{
      this.room = d.get('room');
      this.station = d.get('station');

      if(this.room){
        this.c.setRoom(this.room);
        this.c.setupSettings();
      }
      if(this.station){
        this.c.setStation(this.station);
        this.c.setupStation();
      }
    });
  }
}
