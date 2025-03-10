import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {map, take, tap} from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

const SAVE_PHOTO = gql`
mutation SavePhoto($email: String!, $photo: String!) {
    savePhoto(email: $email, photo: $photo)
  }
`;

const GET_PHOTO = gql`
query GetPatient($email: String!) {
    getPatient(email: $email){
    photo
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PatientCtService {
  private readonly savePhotoResponseSubject = new BehaviorSubject<any>(null);
  savePhoto$ = this.savePhotoResponseSubject.asObservable();
  private readonly getPhotoResponseSubject = new BehaviorSubject<any>(null);
  getPhoto$ = this.getPhotoResponseSubject.asObservable();


  constructor(private readonly apollo: Apollo) { }

  savePhoto(photo: string, email: string): Observable<any> {
    console.log("consumiendo el servicio")
    return this.apollo.mutate({
      mutation: SAVE_PHOTO,
      variables: {
        email: email,
        photo: photo
      }
    }).pipe(
      take(1),
      tap(response => {
        const result = response.data ? response.data : "";
        this.savePhotoResponseSubject.next(result);
      }),
      map(response => response.data)
    );
  }

   getPatient(email: string): Observable<any> {
      return this.apollo.watchQuery<any>({
        query: GET_PHOTO,
        variables: {
          email: email
        }
      }).valueChanges.pipe(
        take(1),
        tap(({data}) =>{
          const photo  = data.getPatient.photo;
          this.getPhotoResponseSubject.next(photo)
        }),
        map(({ data }) => data.getPatient.photo)
      )
    }
}
