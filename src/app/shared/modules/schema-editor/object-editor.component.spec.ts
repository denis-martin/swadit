import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ObjectEditorComponent } from './object-editor.component';

describe('ObjectEditorComponent', () => {
  let component: ObjectEditorComponent;
  let fixture: ComponentFixture<ObjectEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
