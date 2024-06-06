import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators'
import gql from 'graphql-tag';
import { Apollo } from 'apollo-angular';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = '';

  constructor(private http: HttpClient, private apollo: Apollo) { }

  getData(email: string): Observable<any> {
    const params = new HttpParams().set('email', email);
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  sendEmail(email: string): Observable<any> {
    const SEND_EMAIL_MUTATION = gql`
      mutation SendEmail($email: String!) {
        sendEmail(email: $email) {
          success
          message
        }
      }
    `;

    return this.apollo.mutate({
      mutation: SEND_EMAIL_MUTATION,
      variables: {
        email
      }
    }).pipe(
      map(response => response.data.sendEmail)
    );
  }
}
