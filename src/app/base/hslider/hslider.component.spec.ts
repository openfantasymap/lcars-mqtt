import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HsliderComponent } from './hslider.component';

describe('HsliderComponent', () => {
  let component: HsliderComponent;
  let fixture: ComponentFixture<HsliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HsliderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HsliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
