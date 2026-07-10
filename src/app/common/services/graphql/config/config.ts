import { environment } from "../../../../../environments/environment";

export interface ServiceConfig {
  uri: string;
  name: string;
}

export const SERVICES_CONFIG: Record<string, ServiceConfig> = {
  patient_wt: {
    uri: environment.patient_wt.apiUrl,
    name: 'patient-wt'
  },
};
