import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { BaseEmitter } from 'src/app/component-interface';

@Component({
  selector: 'lcars-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent extends BaseEmitter implements OnInit{

  @Input() text:string|unknown;
  @Input() enabledMode: string="static";
  @Input() enabled: boolean=true;
  /** Value published to {room}/io/{emit} on press (for auto-resolution conditions). */
  @Input() value: any = true;

  click: EventEmitter<any> = new EventEmitter<any>()

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  onClick(event:any){
    this.emitValue(this.value);
    this.click.emit(event)
  }

}
