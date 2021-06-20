import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SchemaViewComponent } from './schema-view.component';

describe('SchemaViewComponent', () => {
  let component: SchemaViewComponent;
  let fixture: ComponentFixture<SchemaViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SchemaViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
