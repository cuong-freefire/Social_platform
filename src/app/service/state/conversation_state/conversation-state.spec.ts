import { TestBed } from '@angular/core/testing';

import { ConversationState } from './conversation-state';

describe('ConversationState', () => {
  let service: ConversationState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
