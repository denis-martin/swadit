import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SwadocComponent } from './swadoc.component';

describe('SwadocComponent', () => {
  let component: SwadocComponent;
  let fixture: ComponentFixture<SwadocComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwadocComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwadocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
