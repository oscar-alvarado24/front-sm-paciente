import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const environmentFile = `export const environment = {
  production: '${process.env.PRODUCTION || "false"}',
  cognito: {
    userPoolId: '${process.env.COGNITO_USER_POOL_ID || "default-pool-id"}',
    userPoolClientId: '${process.env.COGNITO_CLIENT_ID || "default-client-id"}',
    region: '${process.env.COGNITO_REGION || "us-east-1"}'
  },
  patient_st: {
    apiUrl: '${process.env.PATIENT_ST_API_URL || "http://localhost:3000"}'
  },  
  patient_ct: {
    apiUrl: '${process.env.PATIENT_CT_API_URL || "http://localhost:3000"}'
  }, 
  url_get_session: '${process.env.URL_GET_SESSION || "http://localhost:3000/get-session"}'
};
`;

writeFileSync('./src/environments/environment.ts', environmentFile);