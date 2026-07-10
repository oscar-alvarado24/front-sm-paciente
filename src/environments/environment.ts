export const environment = {
  production: false,
  cognito: {
    userPoolId: 'us-east-2_k1RqKiXKH',
    userPoolClientId: '234e2te6n99096i7heu1adt49g',
    identityPoolId: 'us-east-2:bc6cd0ac-81af-408c-b77f-6c16e6653a97',
    region: 'us-east-2'
  },
  patient_wt: {
    apiUrl: 'http://localhost:8080/graphql'
  },
  url_get_session: 'https://u7efz36wl5alch3qfcz2e5fawy0arkkr.lambda-url.us-east-2.on.aws/',
  url_save_session: 'https://gtmf6gu4oefrax4leuigzh76ia0uwzfv.lambda-url.us-east-2.on.aws/',
  procedure_api_url: 'http://localhost:8070/api/procedure',
  employee_api_url: 'http://localhost:3001/api/v1/employee',
  provider_api_url: 'http://localhost:8050/providers',
  secretKey: 'Y2mxcvtvYq/9o80rth+2J2zI3W2/+5aGXN59BCqgYdQ=',
  sqs_notifications_url: 'https://sqs.us-east-2.amazonaws.com/050115428314/notification-queue',
  role: 'pacientes',
  cookieDomain: 'localhost',
  patient_nt_api_url: 'http://localhost:8080/api/patient',
};
