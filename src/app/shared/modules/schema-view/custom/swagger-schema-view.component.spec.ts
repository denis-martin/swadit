import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SwaggerSchemaViewComponent } from './swagger-schema-view.component';

describe('SwaggerSchemaViewComponent', () => {
  let component: SwaggerSchemaViewComponent;
  let fixture: ComponentFixture<SwaggerSchemaViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwaggerSchemaViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwaggerSchemaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
