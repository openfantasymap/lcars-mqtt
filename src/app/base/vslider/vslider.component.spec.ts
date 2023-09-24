import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VsliderComponent } from './vslider.component';

describe('VsliderComponent', () => {
  let component: VsliderComponent;
  let fixture: ComponentFixture<VsliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VsliderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VsliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
