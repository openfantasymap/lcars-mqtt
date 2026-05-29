import { Component, EventEmitter, OnInit } from '@angular/core';
import { BaseEmitter } from '../../component-interface';

@Component({
  selector: 'lcars-nav',
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
