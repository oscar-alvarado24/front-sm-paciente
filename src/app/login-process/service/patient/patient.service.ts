import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {map, take, tap} from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

const VALIDATE_STATUS = gql`
query ValidateStatus($email: String!) {
    validateStatus(email: $email)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly validatePatientResponseSubject = new BehaviorSubject<any >(null);
  validatePatient$ = this.validatePatientResponseSubject.asObservable();
  
  constructor(private readonly apollo: Apollo) { }

  validatePatient(email: string): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: VALIDATE_STATUS,
      variables: {
        email: email
      }
    }).valueChanges.pipe(
      take(1),
      tap(({data}) =>{
        const {validateStatus } = data.validateStatus;
        this.validatePatientResponseSubject.next(validateStatus )
        console.log(validateStatus);
      }),
      map(({ data }) => data.validateStatus)
    )
  }
}
