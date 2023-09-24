import { Component, EventEmitter, OnInit, Input } from '@angular/core';
import { BaseEmitter } from 'src/app/component-interface';

@Component({
  selector: 'lcars-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent extends BaseEmitter implements OnInit {

  @Input() text:string|unknown;
  @Input() enabledMode: string="static";
  @Input() enabled: boolean=true;
  @Input() status: boolean=false;

  click: EventEmitter<any> = new EventEmitter<any>()

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  onClick(event:any){
    this.status = !this.status;
    this.click.emit(this.status);
  }

}
