import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileModalComponent } from './file-modal.component';

describe('FileModalComponent', () => {
  let component: FileModalComponent;
  let fixture: ComponentFixture<FileModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
