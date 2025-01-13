import { TestBed } from '@angular/core/testing';

import { HomeDexService } from './home-dex.service';

describe('HomeDexService', () => {
  let service: HomeDexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeDexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
