import { Patient } from "../../models/patient";

export interface SavePhotoResponse {
  savePhoto: string | null;
}

export interface SavePhotoVariables {
  email: string;
  photo: string;
}

export interface GetPatientBasicResponse {
  getPatient: Pick<Patient, 'id' | 'firstName' | 'firstSurname'  | 'photo' | 'cellphone'> | null;
}
