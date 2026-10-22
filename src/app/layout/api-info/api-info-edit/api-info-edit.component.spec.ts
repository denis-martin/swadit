import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiInfoEditComponent } from './api-info-edit.component';

describe('ApiInfoEditComponent', () => {
  let component: ApiInfoEditComponent;
  let fixture: ComponentFixture<ApiInfoEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApiInfoEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiInfoEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
