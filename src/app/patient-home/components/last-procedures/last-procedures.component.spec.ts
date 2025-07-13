import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastProceduresComponent } from './last-procedures.component';

describe('LastProceduresComponent', () => {
  let component: LastProceduresComponent;
  let fixture: ComponentFixture<LastProceduresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LastProceduresComponent]
    });
    fixture = TestBed.createComponent(LastProceduresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
