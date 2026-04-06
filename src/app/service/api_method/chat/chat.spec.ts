import { TestBed } from '@angular/core/testing';

import { ChatApi } from './chat';

describe('Chat', () => {
  let service: ChatApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
