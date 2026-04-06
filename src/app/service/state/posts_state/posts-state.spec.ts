import { TestBed } from '@angular/core/testing';

import { PostsState } from './posts-state';

describe('PostsState', () => {
  let service: PostsState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostsState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
