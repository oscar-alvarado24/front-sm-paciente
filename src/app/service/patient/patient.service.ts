import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {map, take, tap} from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

const VALIDATE_EMAIL = gql`
query ValidateEmail($email: String!) {
    validateEmail(email: $email)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private validateEmailResponseSubject = new BehaviorSubject<any >(null);
  validateEmail$ = this.validateEmailResponseSubject.asObservable();
  
  constructor(private apollo: Apollo) { }

  validateEmail(email: string): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: VALIDATE_EMAIL,
      variables: {
        email: email
      }
    }).valueChanges.pipe(
      take(1),
      tap(({data}) =>{
        const {validateEmail} = data;
        this.validateEmailResponseSubject.next(validateEmail)
        console.log(validateEmail);
      }),
      map(({ data }) => data.validateEmail)
    )
  }
}
