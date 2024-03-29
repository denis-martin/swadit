import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SwaggerSchemaEditorComponent } from './swagger-schema-editor.component';

describe('SwaggerSchemaEditorComponent', () => {
  let component: SwaggerSchemaEditorComponent;
  let fixture: ComponentFixture<SwaggerSchemaEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwaggerSchemaEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwaggerSchemaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
