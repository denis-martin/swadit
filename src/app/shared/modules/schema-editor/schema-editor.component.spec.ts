import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaEditorComponent } from './schema-editor.component';

describe('SchemaEditorComponent', () => {
  let component: SchemaEditorComponent;
  let fixture: ComponentFixture<SchemaEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SchemaEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
