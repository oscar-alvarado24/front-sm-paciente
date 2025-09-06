import { gql } from 'apollo-angular';

export const SAVE_PHOTO = gql`
mutation SavePhoto($email: String!, $photo: String!) {
    savePhoto(email: $email, photo: $photo)
  }
`;