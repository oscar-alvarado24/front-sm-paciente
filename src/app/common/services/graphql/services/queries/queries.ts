import { gql, TypedDocumentNode } from 'apollo-angular';
import { GetPatientBasicResponse, SavePhotoResponse, SavePhotoVariables } from '../model/responses';

export const SAVE_PHOTO: TypedDocumentNode<SavePhotoResponse, SavePhotoVariables> = gql`
mutation SavePhoto($email: String!, $photo: String!) {
    savePhoto(email: $email, photo: $photo)
  }
`;

export const GET_PATIENT:  TypedDocumentNode<GetPatientBasicResponse, { email: string }> = gql`
  query GetPatient($email: String!) {
    getPatient(email: $email) {
      id
      photo
      firstName
      firstSurname
      cellphone
    }
  }
`;
