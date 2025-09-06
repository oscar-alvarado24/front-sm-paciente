import { TestBed } from '@angular/core/testing';

import { PatientCtService } from './patient-ct.service';

describe('PatientCtService', () => {
  let service: PatientCtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientCtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
