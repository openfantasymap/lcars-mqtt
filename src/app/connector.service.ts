import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import {
  IMqttMessage,
  MqttModule,
  IMqttServiceOptions,
  MqttService
} from 'ngx-mqtt';
import { Observable, map, of, share, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectorService {
  sendSettings(settings: any) {
    this._mqttService.unsafePublish(this.room+"/settings", JSON.stringify(settings));
  }

  mode: string|undefined = "mqtt";
  room: string|undefined;
  station: string|undefined;

  settings: any;
  stationSettings:any;

  settingsChange: EventEmitter<any> = new EventEmitter<any>();
  stationChange: EventEmitter<any> = new EventEmitter<any>();
  connectorsChange: EventEmitter<string> = new EventEmitter<string>()

  dataMap: any = {};
  

  constructor(
    private _mqttService: MqttService,
    private h: HttpClient
  ) { }

  setMode(mode:string){
    this.mode = mode;
  }

  setRoom(room:string){
    this.room = room;
  }

  connectors(){
    return Object.keys(this.dataMap);
  }

  setupSettings(){
    this.h.get('/assets/settings.json').subscribe(data=>{
      this.settings = data;
      this.setupConnectors();
      this.settingsChange.emit(this.settings);
    })
    this._mqttService.observe(this.room+"/settings").pipe(map((x:IMqttMessage)=> {
      this.settings = JSON.parse(x.payload.toString());
      this.setupConnectors();
      return this.settings;
    })).subscribe(x => {
      this.settingsChange.emit(this.settings);
    });
    this._mqttService.unsafePublish(this.room+"/connections", JSON.stringify({op: "connect"}), {qos: 1});
    
  }

  setupConnectors(){
    for (let s of this.settings.sources){
      this.dataMap[s] = this._mqttService.observe(this.room+'/io/'+s).pipe(map(x=>{
        let data = JSON.parse(x.payload.toString());
        data['__topic'] = x.topic;
        return data;
      }), tap(x => {
        console.log(x);
      }), share());
      this.connectorsChange.emit(s);
    }
    console.debug(this.dataMap);
  }

  connect(topic:string|unknown){
    if(topic){
      const stopic:string = <string>topic;
      if(Object.keys(this.dataMap).indexOf(stopic) >= 0)
       return this.dataMap[stopic];
      const ret = this._mqttService.observe(this.room+'/io/'+stopic).pipe(share());/*map(x=>{
        let data = JSON.parse(x.payload.toString());
        data['__topic'] = x.topic;
        return data;
      }), tap(x => {
        console.log(x);
      }), share());*/
      this.dataMap[stopic] = ret;
      this.connectorsChange.emit(stopic);
      return ret;
    }
  }

  setStation(station:string){
    this.station = station;
  }

  setupStation(){
    this.h.get('/assets/default.json').subscribe(data=>{
      console.log(data);
      this.stationSettings = data;
      this.stationChange.emit(this.stationSettings);
    });
    this._mqttService.observe(this.room+"/"+this.station+"/form").pipe(map((x:IMqttMessage)=> {
      this.stationSettings = JSON.parse(x.payload.toString());
      return this.stationSettings;
    })).subscribe(x=>{
      this.stationChange.emit(this.stationSettings );
    });
    this._mqttService.unsafePublish(this.room+"/connections", JSON.stringify({op: "connect", station: this.station}), {qos: 1});

  }

  sendMessage(topic:string, message:string){
    this._mqttService.unsafePublish(this.room+"/io/"+topic, message);
  }
}
