import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {map, take, tap} from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

const SAVE_PHOTO = gql`
mutation SavePhoto($email: String!, $photo: String!) {
    savePhoto(email: $email, photo: $photo)
  }
`;
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly savePhotoResponseSubject = new BehaviorSubject<any>(null);
  savePhoto$ = this.savePhotoResponseSubject.asObservable();

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
        console.log('GraphQL response:', response);
        const result = response.data ? response.data : "";
        this.savePhotoResponseSubject.next(result);
      }),
      map(response => response.data)
    );
  }
}
