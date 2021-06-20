import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ResponseEditComponent } from './response-edit.component';

describe('ResponseEditComponent', () => {
  let component: ResponseEditComponent;
  let fixture: ComponentFixture<ResponseEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
