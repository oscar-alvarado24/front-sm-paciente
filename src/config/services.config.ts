import { environment } from '../environments/environment';

export interface ServiceConfig {
  uri: string;
  name: string;
}

export const SERVICES_CONFIG: Record<string, ServiceConfig> = {
  patient_ct: {
    uri: environment.patient_ct.apiUrl,
    name: 'patient-ct'
  },
  patient_st: {
    uri: environment.patient_st.apiUrl,
    name: 'patient-st'
  }
};