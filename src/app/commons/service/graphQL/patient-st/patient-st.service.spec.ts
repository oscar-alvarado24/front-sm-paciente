import { TestBed } from '@angular/core/testing';

import { PatientService } from './patient-st.service';

describe('PatientStService', () => {
  let service: PatientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
