import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEditorComponent } from './security-editor.component';

describe('SecurityEditorComponent', () => {
  let component: SecurityEditorComponent;
  let fixture: ComponentFixture<SecurityEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecurityEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
