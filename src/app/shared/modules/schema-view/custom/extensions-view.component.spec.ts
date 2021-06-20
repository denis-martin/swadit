import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExtensionsViewComponent } from './extensions-view.component';

describe('ExtensionsViewComponent', () => {
  let component: ExtensionsViewComponent;
  let fixture: ComponentFixture<ExtensionsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtensionsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
