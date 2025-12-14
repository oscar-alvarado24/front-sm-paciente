import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const environmentFile = `export const environment = {
  production: ${process.env.PRODUCTION === 'true' ? true : false},
  cognito: {
    userPoolId: '${process.env.COGNITO_USER_POOL_ID || "default-pool-id"}',
    userPoolClientId: '${process.env.COGNITO_CLIENT_ID || "default-client-id"}',
    identityPoolId: '${process.env.COGNITO_IDENTITY_POOL_ID || "default-identity-pool-id"}',
    region: '${process.env.COGNITO_REGION || "us-east-1"}'
  },
  patient_st: {
    apiUrl: '${process.env.PATIENT_ST_API_URL || "http://localhost:3000"}'
  },
  patient_ct: {
    apiUrl: '${process.env.PATIENT_CT_API_URL || "http://localhost:3000"}'
  },
  url_get_session: '${process.env.URL_GET_SESSION || "http://localhost:3000/get-session"}',
  url_save_session: '${process.env.URL_SAVE_SESSION || "https://localhost:3000/save-session"}',
  procedure_api_url: '${process.env.PROCEDURE_API_URL || "http://localhost:8070/api/procedure"}',
  employee_api_url: '${process.env.EMPLOYEE_API_URL || "http://localhost:3001/api/v1/employee"}',
  provider_api_url: '${process.env.PROVIDER_API_URL || "http://localhost:3002/api/v1/provider"}',
  secretKey: '${process.env.SECRET_KEY || "default-secret-key"}',
  sqs_notifications_url: '${process.env.SQS_NOTIFICATIONS_URL || "XXXXXXXXXXXXXXXXXXXXX"}'
};
`;

// Ruta del archivo
const filePath = './src/environments/environment.ts';

// Obtener el directorio (sin el nombre del archivo)
const dir = dirname(filePath);

// Verificar si la carpeta existe, si no, crearla
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true }); // recursive: true crea carpetas anidadas si es necesario
  console.log(`📁 Carpeta creada: ${dir}`);
}

// Escribir el archivo
writeFileSync(filePath, environmentFile);

console.log('✅ Environment file generated successfully');
console.log('📋 Configuration:');
console.log('  - Production:', process.env.PRODUCTION === 'true' ? true : false);
console.log('  - Patient ST API:', process.env.PATIENT_ST_API_URL || 'http://localhost:8080/graphql');
console.log('  - Patient CT API:', process.env.PATIENT_CT_API_URL || 'http://localhost:8080/graphql');