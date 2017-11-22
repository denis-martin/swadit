import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PathEditComponent } from './path-edit.component';

describe('PathEditComponent', () => {
  let component: PathEditComponent;
  let fixture: ComponentFixture<PathEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PathEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PathEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
