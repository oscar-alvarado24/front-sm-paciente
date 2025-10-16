import { TestBed } from '@angular/core/testing';

import { GetAndSaveSessionService } from './get-and-save-session.service';

describe('GetAndSaveSessionService', () => {
  let service: GetAndSaveSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetAndSaveSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
