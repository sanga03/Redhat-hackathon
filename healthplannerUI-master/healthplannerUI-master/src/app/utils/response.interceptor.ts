import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators'
import { MessageBox, MessageBoxButton } from '../shared/message-box';
import { MatDialog } from '@angular/material';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {

    constructor(
        private dialog: MatDialog,
    ) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(request).pipe(
            tap((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                }
            }, (err: any) => {
                let errorMsg = '';
                if (typeof err.error !== 'undefined')
                    errorMsg = err.error.message;
                else if (typeof err.message !== 'undefined')
                    errorMsg = err.message;
                else
                    errorMsg = err.error;
                //console.log('errorMsg ' + errorMsg);
                if (errorMsg == undefined)
                    errorMsg = 'Something went wrong';
                MessageBox.show(this.dialog, "Error", errorMsg, MessageBoxButton.Ok, "350px");
            })
        );
    }

}