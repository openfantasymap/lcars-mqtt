import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarpcoreComponent } from './warpcore.component';

describe('WarpcoreComponent', () => {
  let component: WarpcoreComponent;
  let fixture: ComponentFixture<WarpcoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WarpcoreComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarpcoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
