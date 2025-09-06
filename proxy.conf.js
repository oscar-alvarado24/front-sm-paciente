import dotenv from 'dotenv';

dotenv.config();
export const proxyConfig = {
  "/api/patient_st/*": {
    "target": process.env.PATIENT_ST_API_URL || "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/api/patient_ct/*": {
    "target": process.env.PATIENT_CT_API_URL || "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}