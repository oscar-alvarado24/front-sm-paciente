const fs = require('fs');
require('dotenv').config();

const environmentFile = `export const environment = {
  production: false,
  cognito: {
    userPoolId: '${process.env.COGNITO_USER_POOL_ID || "default-pool-id"}',
    userPoolClientId: '${process.env.COGNITO_CLIENT_ID || "default-client-id"}',
    region: '${process.env.COGNITO_REGION || "us-east-1"}'
  }
};
`;

fs.writeFileSync('./src/environments/environment.ts', environmentFile);