import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimitiveEditorComponent } from './primitive-editor.component';

describe('PrimitiveEditorComponent', () => {
  let component: PrimitiveEditorComponent;
  let fixture: ComponentFixture<PrimitiveEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrimitiveEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimitiveEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
