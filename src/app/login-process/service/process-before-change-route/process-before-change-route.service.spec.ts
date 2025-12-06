import { TestBed } from '@angular/core/testing';

import { ProcessBeforeChangeRouteService } from './process-before-change-route.service';

describe('ProcessBeforeChangeRouteService', () => {
  let service: ProcessBeforeChangeRouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessBeforeChangeRouteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
