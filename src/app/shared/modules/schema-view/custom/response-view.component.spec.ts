import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ResponseViewComponent } from './response-view.component';

describe('ResponseViewComponent', () => {
  let component: ResponseViewComponent;
  let fixture: ComponentFixture<ResponseViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
