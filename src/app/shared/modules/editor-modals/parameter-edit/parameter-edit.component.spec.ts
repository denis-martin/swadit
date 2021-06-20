import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ParameterEditComponent } from './parameter-edit.component';

describe('ParameterEditComponent', () => {
  let component: ParameterEditComponent;
  let fixture: ComponentFixture<ParameterEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ParameterEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParameterEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
