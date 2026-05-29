import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConnectorService } from '../connector.service';
import { IssueService } from '../issue.service';
import { ShipService } from '../ship.service';
import { ScreenService } from '../screen.service';
import { ActivatedRoute } from '@angular/router';
import { share } from 'rxjs';
import { IssuesPanelComponent } from './issues-panel/issues-panel.component';
import { ShipOverviewComponent } from './ship-overview/ship-overview.component';
import { ScreenEditorComponent } from './screen-editor/screen-editor.component';
import { ValuerendererComponent } from '../valuerenderer/valuerenderer.component';

@Component({
  selector: 'app-master',
  imports: [
    CommonModule,
    FormsModule,
    IssuesPanelComponent,
    ShipOverviewComponent,
    ScreenEditorComponent,
    ValuerendererComponent
  ],
  templateUrl: './master.component.html',
  styleUrls: ['./master.component.scss']
})
export class MasterComponent implements OnInit {
  room: string|null = "";

  active:string = "main";
  configuration:any = {};
  settings:any = {};

  connections:any={};
  cvs:any={}

  constructor(
    public c: ConnectorService,
    public issues: IssueService,
    public fleet: ShipService,
    public screens: ScreenService,
    private ar: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.room = this.ar.snapshot.paramMap.get('room');
    this.c.settingsChange.subscribe(data=>{
      this.settings = data;
    })
    this.c.connectorsChange.subscribe(conn=>{
      this.connections[conn] = this.c.connect(conn).pipe(share());
      this.connections[conn].subscribe((data:any)=>{
        this.cvs[conn] = data;
        
      })
      this.cvs[conn] = null;
    })
    if(this.room){
      this.c.setRoom(this.room);
      this.c.setupSettings();
      this.issues.setup(this.room);
      this.fleet.setup(this.room, true);
      this.screens.setup(this.room);
    }
  }

  do(tgt:any){
    if (tgt.type === "tab"){
      this.active=tgt.tab;
    }
  }

  sync(){
    this.c.sendSettings(this.settings);
  }

  shipWide(status:string){
    this.c.shipCondition({status:status});
  }


}
