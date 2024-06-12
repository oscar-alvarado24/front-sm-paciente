import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {take, tap} from 'rxjs/operators';
import { BehaviorSubject, from } from 'rxjs';

const VALIDATE_EMAIL = gql`
query{
  validateEmail(email: "mail@correo.com")
}
`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private validateEmailResponseSubject = new BehaviorSubject<any >('');
  validateEmail$ = this.validateEmailResponseSubject.asObservable();
  
  constructor(private apollo: Apollo) { }

  validateEmail():void{
    this.apollo.watchQuery<any>({
      query: VALIDATE_EMAIL
    }).valueChanges.pipe(
      take(1),
      tap(({data}) =>{
        const {validateEmail} = data;
        this.validateEmailResponseSubject.next(validateEmail)
        console.log(validateEmail);
      })
    ).subscribe();
  }
}
