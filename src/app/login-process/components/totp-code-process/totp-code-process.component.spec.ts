import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotpCodeProcessComponent} from './totp-code-process.component';

describe('TotpCodeComponent', () => {
  let component: TotpCodeProcessComponent;
  let fixture: ComponentFixture<TotpCodeProcessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TotpCodeProcessComponent]
    });
    fixture = TestBed.createComponent(TotpCodeProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
