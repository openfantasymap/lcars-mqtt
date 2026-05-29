import { Component, EventEmitter, OnInit } from '@angular/core';
import { BaseEmitter } from '../../component-interface';

@Component({
  selector: 'app-dpad',
  templateUrl: './nav.component.svg',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent extends BaseEmitter implements OnInit {

  navDirection: EventEmitter<string> = new EventEmitter<string>();

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  nav(direction: string) {
    this.emitValue(direction);
    this.navDirection.emit(direction);
  }

}
