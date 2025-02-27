import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeTotpComponent } from './code-totp.component';

describe('CodeTotpComponent', () => {
  let component: CodeTotpComponent;
  let fixture: ComponentFixture<CodeTotpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodeTotpComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeTotpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
