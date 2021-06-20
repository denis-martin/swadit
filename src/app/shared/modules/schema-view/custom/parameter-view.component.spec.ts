import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ParameterViewComponent } from './parameter-view.component';

describe('ParameterViewComponent', () => {
  let component: ParameterViewComponent;
  let fixture: ComponentFixture<ParameterViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ParameterViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParameterViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
