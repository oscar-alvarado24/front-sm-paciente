import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {map, take, tap, catchError} from 'rxjs/operators';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

const GET_PATIENT = gql`
  query GetPatient($email: String!) {
    getPatient(email: $email) {
      photo
      status
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly getPatientResponseSubject   = new BehaviorSubject<any >(null);
  getPatient$ = this.getPatientResponseSubject.asObservable();
  
  constructor(private readonly apollo: Apollo) { }

  getPatient(email: string): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: GET_PATIENT,
      variables: {
        email: email
      }
    }).valueChanges.pipe(
      take(1),
      tap(({data}) =>{
        const {getPatient } = data.getPatient;
        this.getPatientResponseSubject
        .next(getPatient )
        console.log(getPatient);
      }),
      map(({ data }) => data.getPatient),
      catchError(error => {
        console.error('Error al validar paciente:', error);
        
        // Verificar si es una PatientNotFoundException usando la clasificación
        if (error.graphQLErrors && error.graphQLErrors.length > 0) {
          const graphQLError = error.graphQLErrors[0];
          if (graphQLError.extensions?.classification === 'NOT_FOUND') {
            this.getPatientResponseSubject.next(null);
            return of({ 
              userNotFound: true, 
              message: graphQLError.message || 'Usuario no encontrado' 
            });
          }
        }
        
        // Para otros errores, propagar el error
        this.getPatientResponseSubject.next(null);
        return throwError(() => error);
      })
    )
  }
}