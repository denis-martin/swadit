import { NgModule } from '@angular/core';
import { TrimValueAccessor } from './trim-value-accessor.directive';

@NgModule({
  declarations: [ TrimValueAccessor ],
  exports: [ TrimValueAccessor ]
})
export class TrimValueAccessorModule { }