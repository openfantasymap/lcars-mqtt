import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransporterbufferComponent } from './transporterbuffer.component';

describe('TransporterbufferComponent', () => {
  let component: TransporterbufferComponent;
  let fixture: ComponentFixture<TransporterbufferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransporterbufferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransporterbufferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
