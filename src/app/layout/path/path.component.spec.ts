import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PathComponent } from './path.component';

describe('PathComponent', () => {
  let component: PathComponent;
  let fixture: ComponentFixture<PathComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PathComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
