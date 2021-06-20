import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SchemaPrintViewComponent } from './schema-print-view.component';

describe('SchemaPrintViewComponent', () => {
  let component: SchemaPrintViewComponent;
  let fixture: ComponentFixture<SchemaPrintViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SchemaPrintViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaPrintViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
