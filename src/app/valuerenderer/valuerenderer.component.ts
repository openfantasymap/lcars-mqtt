import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lcars-valuerenderer',
  templateUrl: './valuerenderer.component.html',
  styleUrls: ['./valuerenderer.component.scss']
})
export class ValuerendererComponent implements OnInit {

  @Input() value: any;

  constructor() { }

  ngOnInit(): void {
  }

}
