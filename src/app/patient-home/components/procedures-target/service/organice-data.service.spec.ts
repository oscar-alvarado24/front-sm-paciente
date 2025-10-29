import { TestBed } from '@angular/core/testing';

import { OrganiceDataService } from './organice-data.service';

describe('OrganiceDataService', () => {
  let service: OrganiceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganiceDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
