import { TestBed } from '@angular/core/testing';

import { GetAndProcessProcedureService } from './get-and-process-procedure.service';

describe('GetAndProcessProcedureService', () => {
  let service: GetAndProcessProcedureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetAndProcessProcedureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
