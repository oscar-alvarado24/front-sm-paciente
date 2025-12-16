import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Verificar directorio actual
console.log('📍 Directorio actual:', process.cwd());
console.log('📂 Contenido:', readdirSync('.'));

// Ruta del archivo
const filePath = './src/environments/environment.ts';

// Obtener el directorio (sin el nombre del archivo)
const dir = dirname(filePath);

// Crear el directorio siempre (recursive: true no falla si ya existe)
try {
  mkdirSync(dir, { recursive: true });
  console.log(`📁 Directorio asegurado: ${dir}`);
} catch (error) {
  console.error('❌ Error creando directorio:', error);
  // Intentar crear manualmente
  try {
    mkdirSync('src', { recursive: true });
    mkdirSync('src/environments', { recursive: true });
    console.log('📁 Directorio creado manualmente');
  } catch (err) {
    console.error('❌ Error crítico:', err);
    process.exit(1);
  }
}

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



// Escribir el archivo
try {
  writeFileSync(filePath, environmentFile);
  console.log('✅ Archivo environment.ts creado/actualizado exitosamente');
} catch (error) {
  console.error('❌ Error al escribir el archivo:', error);
  process.exit(1);
}

console.log('✅ Environment file generated successfully');
console.log('📋 Configuration:');
console.log('  - Production:', process.env.PRODUCTION === 'true' ? true : false);
console.log('  - Patient ST API:', process.env.PATIENT_ST_API_URL || 'http://localhost:8080/graphql');
console.log('  - Patient CT API:', process.env.PATIENT_CT_API_URL || 'http://localhost:8080/graphql');