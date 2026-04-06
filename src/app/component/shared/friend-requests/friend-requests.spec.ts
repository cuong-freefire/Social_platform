import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendRequest } from './friend-request';

describe('FriendRequest', () => {
  let component: FriendRequest;
  let fixture: ComponentFixture<FriendRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
