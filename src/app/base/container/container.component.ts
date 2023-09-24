import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lcars-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent implements OnInit {

  @Input() configuration:any;

  constructor() { }

  ngOnInit(): void {
  }

}
