import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeOriginPasswordComponent } from './change-origin-password.component';

describe('ChangeOriginPasswordComponent', () => {
  let component: ChangeOriginPasswordComponent;
  let fixture: ComponentFixture<ChangeOriginPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeOriginPasswordComponent]
    });
    fixture = TestBed.createComponent(ChangeOriginPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
