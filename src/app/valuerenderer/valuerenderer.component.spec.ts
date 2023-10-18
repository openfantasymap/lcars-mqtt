import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuerendererComponent } from './valuerenderer.component';

describe('ValuerendererComponent', () => {
  let component: ValuerendererComponent;
  let fixture: ComponentFixture<ValuerendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValuerendererComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuerendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
