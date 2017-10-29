import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefinitionsComponent } from './definitions.component';

describe('DefinitionsComponent', () => {
  let component: DefinitionsComponent;
  let fixture: ComponentFixture<DefinitionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefinitionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefinitionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
