import { Component, Input, OnInit } from '@angular/core';
import { ConnectorService } from '../connector.service';

@Component({
  selector: 'lcars-interface',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.scss']
})
export class InterfaceComponent implements OnInit {

  @Input() title: string|undefined = "LCARS";
  @Input() footer: string|undefined = "NCC-1701-D"
  @Input() configuration: any;

  active:string = "main";

  constructor(
    private c: ConnectorService
  ) { }

  ngOnInit(): void {
    this.c.stationChange.subscribe(data=>{
      this.configuration = data;
    })
  }

  do(tgt:any){
    if (tgt.type === "tab"){
      this.active=tgt.tab;
    }
  }

}
