import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe, provideTranslateService } from '@ngx-translate/core';

import { HeaderComponent, SidebarComponent } from '../shared';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      RouterTestingModule,
      NgbDropdownModule,
      TranslatePipe,
    ],
      providers: [provideTranslateService()],
      declarations: [
        LayoutComponent,
        HeaderComponent,
        SidebarComponent,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
