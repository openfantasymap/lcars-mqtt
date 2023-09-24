import { Component, OnInit } from '@angular/core';
import { ConnectorService } from '../connector.service';
import { ActivatedRoute } from '@angular/router';
import { share } from 'rxjs';

@Component({
  selector: 'app-master',
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

  shipStatus(status:string){
    this.c.shipCondition({status:status});
  }

}
