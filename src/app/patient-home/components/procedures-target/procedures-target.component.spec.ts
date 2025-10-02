import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProceduresTargetComponent } from './procedures-target.component';

describe('ProceduresTargetComponent', () => {
  let component: ProceduresTargetComponent;
  let fixture: ComponentFixture<ProceduresTargetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProceduresTargetComponent]
    });
    fixture = TestBed.createComponent(ProceduresTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
