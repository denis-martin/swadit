import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathsComponent } from './paths.component';

describe('PathsComponent', () => {
  let component: PathsComponent;
  let fixture: ComponentFixture<PathsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PathsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PathsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
