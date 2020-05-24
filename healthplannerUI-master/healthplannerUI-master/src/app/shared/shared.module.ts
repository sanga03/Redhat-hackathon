import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DialogComponent } from './dialog/dialog.component';
import { RequestInterceptor } from '../utils/request.interceptor';
import { ResponseInterceptor } from '../utils/response.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
  ],
  exports: [
    MaterialModule,
    FlexLayoutModule,
    DialogComponent,
  ],
  declarations: [
    DialogComponent
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    //{ provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ResponseInterceptor, multi: true },
  ],
  entryComponents: [
    DialogComponent,
  ]
})
export class SharedModule { }
