import { gql } from 'apollo-angular';
export const GET_PATIENT = gql`
  query getPatient($email: String!) {
    getPatient(email: $email) {
      id
      photo
      status
      firstName
      firstSurName
      cellPhone
    }
  }
`;

export const VALIDATE_SES_STATUS = gql`
  query validateStatusSesRegistration($email: String!) {
    validateStatusSesRegistration(email: $email)
  }
`;