import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParameterEditComponent } from './parameter-edit.component';

describe('ParameterEditComponent', () => {
  let component: ParameterEditComponent;
  let fixture: ComponentFixture<ParameterEditComponent>;

  beforeEach(async(() => {
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
