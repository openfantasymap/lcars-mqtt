import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import {
  IMqttMessage,
  MqttModule,
  IMqttServiceOptions,
  MqttService
} from 'ngx-mqtt';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectorService {

  room: string|undefined;
  station: string|undefined;

  settings: any;
  stationSettings:any;

  settingsChange: EventEmitter<any> = new EventEmitter<any>();
  stationChange: EventEmitter<any> = new EventEmitter<any>();

  dataMap: Map<string, EventEmitter<any>> = new Map<string, EventEmitter<any>>();

  constructor(
    private _mqttService: MqttService,
    private h: HttpClient
  ) { }

  setRoom(room:string){
    this.room = room;
  }

  setupSettings(){
    this._mqttService.observe(this.room+"/settings").pipe(map((x:IMqttMessage)=> {
      this.settings = JSON.parse(x.payload.toString());
      return this.settings;
    })).subscribe(x => {
      this.settingsChange.emit(x);
    });
    this._mqttService.unsafePublish(this.room+"/connections", JSON.stringify({op: "connect"}), {qos: 1});
  }

  setStation(station:string){
    this.station = station;
  }

  setupStation(){
    this._mqttService.observe(this.room+"/"+this.station+"/form").pipe(map((x:IMqttMessage)=> {
      this.stationSettings = JSON.parse(x.payload.toString());
      return this.stationSettings;
    })).subscribe(x=>{
      this.stationChange.emit(x);
    });
  }

  sendMessage(topic:string, message:string){
    this._mqttService.unsafePublish(this.room+"/io/"+topic, message);
  }
}
