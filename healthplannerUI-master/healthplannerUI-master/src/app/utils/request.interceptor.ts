import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let token: string = "";
        let logedUser = JSON.parse(localStorage.getItem('logedUser'));
        
        return next.handle(request);
    }
}