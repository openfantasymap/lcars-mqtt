import { Component, OnInit } from '@angular/core';
import { ConnectorService } from '../connector.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-station',
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss']
})
export class StationComponent implements OnInit {

  room: string|null = null;
  station: string|null = null;

  configuration: any;
  settings: any = {
    title: "LCARS"
  }

  constructor(
    private c: ConnectorService,
    private ar: ActivatedRoute
  ) { }

  ngOnInit(): void {
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
    this.c.settingsChange.subscribe(data=>{
      this.settings=data;
    });
  }
}