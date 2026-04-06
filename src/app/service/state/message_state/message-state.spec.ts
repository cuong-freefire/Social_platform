import { TestBed } from '@angular/core/testing';

import { MessageState } from './message-state';

describe('MessageState', () => {
  let service: MessageState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
