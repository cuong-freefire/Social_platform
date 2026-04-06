import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendDetail } from './friend-detail';

describe('FriendDetail', () => {
  let component: FriendDetail;
  let fixture: ComponentFixture<FriendDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
