import { Component, EventEmitter, OnInit } from '@angular/core';
import { ConnectorService } from '../../connector.service';
import { CommandComponentInterface } from '../../component-interface';

@Component({
  selector: 'lcars-nav',
  templateUrl: './nav.component.svg',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, CommandComponentInterface {

  navDirection: EventEmitter<string> = new EventEmitter<string>();
  constructor(
    private c: ConnectorService
  ) { }

  ngOnInit(): void {
  }

  nav(direction:string){
    this.c.sendMessage('navigation/direction', direction);
    this.navDirection.emit(direction);
  }

}
