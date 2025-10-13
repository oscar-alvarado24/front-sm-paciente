import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WiewCardsProcedureComponent } from './wiew-cards-procedure.component';

describe('WiewCardsProcedureComponent', () => {
  let component: WiewCardsProcedureComponent;
  let fixture: ComponentFixture<WiewCardsProcedureComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WiewCardsProcedureComponent]
    });
    fixture = TestBed.createComponent(WiewCardsProcedureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
