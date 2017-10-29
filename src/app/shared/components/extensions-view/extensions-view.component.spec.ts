import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionsViewComponent } from './extensions-view.component';

describe('ExtensionsViewComponent', () => {
  let component: ExtensionsViewComponent;
  let fixture: ComponentFixture<ExtensionsViewComponent>;

  beforeEach(async(() => {
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
