import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialFormComponent } from './initial-form.component';

describe('InitialFormComponent', () => {
  let component: InitialFormComponent;
  let fixture: ComponentFixture<InitialFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InitialFormComponent]
    });
    fixture = TestBed.createComponent(InitialFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
