import { Component, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEmitter } from '../../component-interface';

@Component({
  selector: 'lcars-toggle',
  imports: [CommonModule],
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
    this.emitValue(this.status);
    this.click.emit(this.status);
  }

}
