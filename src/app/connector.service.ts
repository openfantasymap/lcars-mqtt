import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Observable, map, share, tap } from 'rxjs';

/**
 * Central MQTT gateway. All cross-component state and I/O flow through here.
 * Everything is namespaced under `{room}/...`; see the generic helpers below.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectorService {
  mode: string | undefined = "mqtt";
  room: string | undefined;
  station: string | undefined;

  settings: any;
  stationSettings: any;

  settingsChange: EventEmitter<any> = new EventEmitter<any>();
  stationChange: EventEmitter<any> = new EventEmitter<any>();
  connectorsChange: EventEmitter<string> = new EventEmitter<string>();
  conditionChange: EventEmitter<any> = new EventEmitter<any>();

  dataMap: any = {};

  constructor(
    private _mqttService: MqttService,
    private h: HttpClient
  ) { }

  // --- generic transport helpers (room-namespaced) --------------------------

  /** Full topic for a room-relative sub-path. */
  topicFor(sub: string): string {
    return `${this.room}/${sub}`;
  }

  /** Publish a raw string payload to `{room}/{sub}`. */
  publishRaw(sub: string, payload: string, opts?: any) {
    this._mqttService.unsafePublish(this.topicFor(sub), payload, opts);
  }

  /** Publish a JSON-serialised object to `{room}/{sub}` (pass `{retain:true}` for a snapshot). */
  publishJson(sub: string, obj: any, opts?: any) {
    this.publishRaw(sub, JSON.stringify(obj), opts);
  }

  /** Observe `{room}/{sub}`, parsing each payload as JSON. */
  observeJson<T = any>(sub: string): Observable<T> {
    return this._mqttService.observe(this.topicFor(sub)).pipe(
      map((m: IMqttMessage) => JSON.parse(m.payload.toString()) as T)
    );
  }

  // --- session wiring -------------------------------------------------------

  setMode(mode: string) {
    this.mode = mode;
  }

  setRoom(room: string) {
    this.room = room;
  }

  setStation(station: string) {
    this.station = station;
  }

  connectors() {
    return Object.keys(this.dataMap);
  }

  shipCondition(arg0: any) {
    // Retained so any screen joining mid-session immediately reflects the alert.
    this.publishJson('global', arg0, { qos: 1, retain: true });
  }

  sendSettings(settings: any) {
    this.publishJson('settings', settings);
  }

  setupSettings() {
    this.h.get('/assets/settings.json').subscribe(data => {
      this.settings = data;
      this.setupConnectors();
      this.settingsChange.emit(this.settings);
    });
    this.observeJson('settings').subscribe(data => {
      this.settings = data;
      this.setupConnectors();
      this.settingsChange.emit(this.settings);
    });
    // Ship-wide alert condition (driven by manual SHIP buttons or open issues).
    this.observeJson('global').subscribe((data: any) => {
      this.conditionChange.emit(data && data.status ? data.status : 'default');
    });
    this.publishJson('connections', { op: "connect" }, { qos: 1 });
  }

  setupConnectors() {
    for (let s of this.settings.sources) {
      this.dataMap[s] = this._mqttService.observe(this.topicFor('io/' + s)).pipe(map(x => {
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

  connect(topic: string | unknown) {
    if (topic) {
      const stopic: string = <string>topic;
      if (Object.keys(this.dataMap).indexOf(stopic) >= 0)
        return this.dataMap[stopic];
      const ret = this._mqttService.observe(this.topicFor('io/' + stopic)).pipe(share());
      this.dataMap[stopic] = ret;
      this.connectorsChange.emit(stopic);
      return ret;
    }
  }

  // Layout sources, in priority order (highest first): GM screen registry,
  // per-station form push, asset seed.
  private screenLayout: any;
  private formLayout: any;
  private seedLayout: any;

  private emitLayout() {
    const eff = this.screenLayout || this.formLayout || this.seedLayout;
    if (eff) {
      this.stationSettings = eff;
      this.stationChange.emit(this.stationSettings);
    }
  }

  setupStation() {
    // Asset seed from the built-in role layouts, keyed by station id (e.g.
    // 'comms', 'conn', 'engineering'), falling back to 'default'.
    this.h.get<any>('/assets/stations.json').subscribe(data => {
      this.seedLayout = data && (data[this.station as string] || data['default']);
      this.emitLayout();
    });
    // GM-authored screen registry (Master screen editor) — wins over the seed.
    this.observeJson<any>('screens').subscribe(reg => {
      this.screenLayout = reg && reg[this.station as string];
      this.emitLayout();
    });
    // Legacy per-station form push — wins over the seed, below the registry.
    this.observeJson(this.station + '/form').subscribe(data => {
      this.formLayout = data;
      this.emitLayout();
    });
    this.publishJson('connections', { op: "connect", station: this.station }, { qos: 1 });
  }

  /** Publish a player's control value to `{room}/io/{emit}`, wrapped as {value} (see lcars-valuerenderer). */
  publishIo(emit: string, value: any) {
    this.publishJson('io/' + emit, { value });
  }

  sendMessage(topic: string, message: string) {
    this.publishRaw('io/' + topic, message);
  }
}
