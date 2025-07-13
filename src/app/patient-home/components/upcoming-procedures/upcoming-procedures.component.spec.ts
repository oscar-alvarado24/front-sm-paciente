import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingProceduresComponent } from './upcoming-procedures.component';

describe('UpcomingProceduresComponent', () => {
  let component: UpcomingProceduresComponent;
  let fixture: ComponentFixture<UpcomingProceduresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpcomingProceduresComponent]
    });
    fixture = TestBed.createComponent(UpcomingProceduresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
