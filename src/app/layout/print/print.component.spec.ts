import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintComponent } from './print.component';

describe('PrintComponent', () => {
  let component: PrintComponent;
  let fixture: ComponentFixture<PrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
