# front-sm-paciente 🏥

This project is an Angular-based frontend application designed for managing patient information and related healthcare services.

## Badges

[![Angular Version](https://img.shields.io/badge/Angular-17.2-blue.svg)](https://angular.io/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Bootstrap Version](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)](https://getbootstrap.com/)
[![AWS Amplify](https://img.shields.io/badge/AWS%20Amplify-managed-orange.svg)](https://aws.amazon.com/amplify/)
[![Apollo Client](https://img.shields.io/badge/Apollo%20Client-integrated-FF6B75.svg)](https://www.apollographql.com/)

## Description 📝

The `front-sm-paciente` project provides a robust interface for patients to interact with healthcare services. It allows users to manage appointments, access medical records, view medication information, and receive notifications. The application leverages Angular for its frontend framework, integrating with various backend services for authentication, data management, and communication.

## Table of Contents 📑

- [Features](#features-🌟)
- [Tech Stack](#tech-stack-🛠️)
- [Project Structure](#project-structure-📁)
- [Installation](#installation--)
- [Usage](#usage--)
- [Development Server](#development-server--)
- [Build](#build-🏗️)
- [Running Unit Tests](#running-unit-tests--️)
- [Contributing](#contributing-🤝)
- [License](#license-⚖️)
- [Important Links](#important-links-🔗)
- [Footer](#footer--)

## Features 🌟

- **User Authentication:** Secure login and authentication using AWS Amplify with Cognito, supporting email/password and Multi-Factor Authentication (MFA) via TOTP.
- **Patient Profile Management:** Users can view and update their profile information, including uploading a profile picture.
- **Medical Appointment Scheduling:** Functionality to schedule, modify, and cancel medical appointments.
- **Laboratory Services:** Access to laboratory results and appointment scheduling for lab tests.
- **Medication Management:** View prescription details and process medication claims.
- **Notifications:** Receive important updates and notifications within the application.
- **Session Tracking:** Records and displays user session information (IP address, location, connection time).
- **Password Management:** Secure workflows for resetting and changing passwords.
- **API Integration:** Integrates with multiple microservices for procedures, employee data, provider information, and patient data via GraphQL and REST APIs.
- **Data Encryption:** Sensitive data is encrypted using AES-GCM before being sent to the backend.
- **Error Handling:** Comprehensive error handling for API requests and application logic.

## Tech Stack 🛠️

- **Frontend Framework:** Angular (v17+)
- **Language:** TypeScript
- **Styling:** SCSS, Bootstrap 5
- **State Management:** Angular Signals
- **Authentication:** AWS Amplify (Cognito)
- **GraphQL Client:** Apollo Client
- **HTTP Client:** Angular HttpClient
- **API Integration:** RESTful APIs, GraphQL
- **Testing:** Vitest
- **Build Tool:** Angular CLI
- **Package Manager:** pnpm
- **Utilities:** Bootstrap Icons, angularx-qrcode

## Project Structure 📁

```
front-sm-paciente/
├── .env
├── .eslintrc.cjs
├── .prettierrc
├── angular.json
├── diagrams.puml
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
├── proxy.conf.cjs
├── README.md
├── scripts/
│   └── config-env.js
├── src/
│   ├── app/
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.scss
│   │   ├── app.spec.ts
│   │   ├── common/
│   │   │   ├── component/
│   │   │   │   ├── footer/
│   │   │   │   │   ├── footer.html
│   │   │   │   │   ├── footer.scss
│   │   │   │   │   └── footer.ts
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.html
│   │   │   │   │   ├── header.scss
│   │   │   │   │   └── header.ts
│   │   │   │   ├── options-menu/
│   │   │   │   │   ├── options-menu.html
│   │   │   │   │   ├── options-menu.scss
│   │   │   │   │   └── options-menu.ts
│   │   │   ├── services/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── interface/
│   │   │   │   │   │   ├── cognito-response.ts
│   │   │   │   │   │   └── password-change-response.ts
│   │   │   │   │   └── auth.ts
│   │   │   │   ├── crypto/
│   │   │   │   │   └── crypto.ts
│   │   │   │   ├── employee/
│   │   │   │   │   ├── interface/
│   │   │   │   │   │   └── employees.ts
│   │   │   │   │   └── employee.ts
│   │   │   │   ├── graphql/
│   │   │   │   │   ├── base/
│   │   │   │   │   │   └── base-graphql.ts
│   │   │   │   │   ├── config/
│   │   │   │   │   │   └── config.ts
│   │   │   │   │   ├── error/
│   │   │   │   │   │   └── error-type.ts
│   │   │   │   │   ├── models/
│   │   │   │   │   │   └── patient.ts
│   │   │   │   │   ├── multi-apolo/
│   │   │   │   │   │   └── multi-apolo.ts
│   │   │   │   │   └── services/
│   │   │   │   │       ├── model/
│   │   │   │   │       │   └── responses.ts
│   │   │   │   │       ├── patient-wt.ts
│   │   │   │   │       │   └── queries/
│   │   │   │   │           └── queries.ts
│   │   │   ├── http-helper/
│   │   │   │   ├── interface/
│   │   │   │   │   ├── custom-headers.ts
│   │   │   │   │   │   └── http-options.ts
│   │   │   │   │   └── http-helper.ts
│   │   │   ├── local-storage/
│   │   │   │   └── local-storage.ts
│   │   │   ├── patient/
│   │   │   │   ├── model/
│   │   │   │   │   └── response.ts
│   │   │   │   └── patient-nt.ts
│   │   │   ├── procedure/
│   │   │   │   ├── interface/
│   │   │   │   │   ├── procedure-error-type.ts
│   │   │   │   │   ├── procedure-error.ts
│   │   │   │   │   └── medical-procedure.ts
│   │   │   │   │   └── manejo-error/
│   │   │   │       │   └── handle-procedure-error.ts
│   │   │   │   │   └── procedure.ts
│   │   │   ├── provider/
│   │   │   │   ├── interface/
│   │   │   │   │   ├── branch-request.ts
│   │   │   │   │   │   └── branch.ts
│   │   │   │   │   └── provider.ts
│   │   │   │   └── sqs/
│   │   │   │       └── sqs.ts
│   │   ├── shared-imports.ts
│   │   ├── home/
│   │   │   ├── component/
│   │   │   │   ├── left-menu/
│   │   │   │   │   ├── left-menu.html
│   │   │   │   │   ├── left-menu.scss
│   │   │   │   │   └── left-menu.ts
│   │   │   │   ├── patient-home/
│   │   │   │   │   ├── patient-home.html
│   │   │   │   │   ├── patient-home.scss
│   │   │   │   │   └── patient-home.ts
│   │   │   │   │   └── view-cards-procedure/
│   │   │   │       │   ├── view-cards-procedure.html
│   │   │   │       │   ├── view-cards-procedure.scss
│   │   │   │       │   └── view-cards-procedure.ts
│   │   │   ├── model/
│   │   │   │   └── target-procedure.ts
│   │   ├── login/
│   │   │   ├── component/
│   │   │   │   ├── change-origin-password/
│   │   │   │   │   ├── change-origin-password.html
│   │   │   │   │   ├── change-origin-password.scss
│   │   │   │   │   └── change-origin-password.ts
│   │   │   │   ├── change-password/
│   │   │   │   │   ├── change-password.html
│   │   │   │   │   ├── change-password.scss
│   │   │   │   │   └── change-password.ts
│   │   │   │   ├── code-totp/
│   │   │   │   │   ├── code-totp.html
│   │   │   │   │   ├── code-totp.scss
│   │   │   │   │   └── code-totp.ts
│   │   │   │   ├── count-down/
│   │   │   │   │   ├── count-down.html
│   │   │   │   │   ├── count-down.scss
│   │   │   │   │   └── count-down.ts
│   │   │   │   ├── email/
│   │   │   │   │   ├── email.html
│   │   │   │   │   ├── email.scss
│   │   │   │   │   └── email.ts
│   │   │   │   ├── form/
│   │   │   │   │   ├── form.html
│   │   │   │   │   ├── form.scss
│   │   │   │   │   └── form.ts
│   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── loading-spinner.html
│   │   │   │   │   ├── loading-spinner.scss
│   │   │   │   │   └── loading-spinner.ts
│   │   │   │   ├── login-process/
│   │   │   │   │   ├── login-process.html
│   │   │   │   │   ├── login-process.scss
│   │   │   │   │   └── login-process.ts
│   │   │   │   ├── password/
│   │   │   │   │   ├── password.html
│   │   │   │   │   ├── password.scss
│   │   │   │   │   └── password.ts
│   │   │   │   ├── qr-code/
│   │   │   │   │   ├── qr-code.html
│   │   │   │   │   ├── qr-code.scss
│   │   │   │   │   └── qr-code.ts
│   │   │   │   ├── recover-password/
│   │   │   │   │   ├── recover-password.html
│   │   │   │   │   ├── recover-password.scss
│   │   │   │   │   └── recover-password.ts
│   │   │   │   ├── totp-code-process/
│   │   │   │   │   ├── totp-code-process.html
│   │   │   │   │   ├── totp-code-process.scss
│   │   │   │   │   └── totp-code-process.ts
│   │   │   ├── guard/
│   │   │   │   └── login-guard.ts
│   │   │   ├── service/
│   │   │   │   ├── get-and-process-procedure/
│   │   │   │   │   └── get-and-process-procedure-service.ts
│   │   │   │   ├── get-and-save-session/
│   │   │   │   │   ├── get-ip-data/
│   │   │   │   │   │   ├── model/
│   │   │   │   │   │   │   └── ip-data.ts
│   │   │   │   │   │   └── get-ip-data-service.ts
│   │   │   │   │   ├── get-ip/
│   │   │   │   │   │   ├── model/
│   │   │   │   │   │   │   └── ip.ts
│   │   │   │   │   │   └── get-ip-service.ts
│   │   │   │   │   ├── process-before-change-route/
│   │   │   │   │   │   └── process-before-change-route-service.ts
│   │   │   │   │   ├── session/
│   │   │   │   │   │   ├── model/
│   │   │   │   │   │   │   ├── location.ts
│   │   │   │   │   │   │   └── session-response.ts
│   │   │   │   │   │   └── session-service.ts
│   │   │   │   │   └── get-and-save-session-service.ts
│   │   │   │   └── session/
│   │   │   │       ├── model/
│   │   │   │       │   ├── location.ts
│   │   │   │       │   └── session-response.ts
│   │   │   │       └── session-service.ts
│   │   ├── start/
│   │   │   ├── component/
│   │   │   │   └── landing-page/
│   │   │       │       ├── landing-page.html
│   │   │       │       ├── landing-page.scss
│   │   │       │       └── landing-page.ts
│   │   ├── environments/
│   │   │   ├── environment.prod.ts
│   │   │   └── environment.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

## Installation 🛠️

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oscar-alvarado24/front-sm-paciente.git
   cd front-sm-paciente
   ```

2. **Install dependencies using pnpm:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root directory.
   - Populate it with your environment-specific configurations (e.g., AWS Cognito details, API URLs).
   - The `scripts/config-env.js` script will use these variables to generate the `src/environments/environment.ts` file during the build process.

   Example `.env` file:
   ```dotenv
   PRODUCTION=false
   COGNITO_USER_POOL_ID=us-east-2_k1RqKiXKH
   COGNITO_CLIENT_ID=234e2te6n99096i7heu1adt49g
   COGNITO_IDENTITY_POOL_ID=us-east-2:bc6cd0ac-81af-408c-b77f-6c16e6653a97
   COGNITO_REGION=us-east-2
   PATIENT_WT_API_URL=http://localhost:8080/graphql
   URL_GET_SESSION=https://u7efz36wl5alch3qfcz2e5fawy0arkkr.lambda-url.us-east-2.on.aws/
   URL_SAVE_SESSION=https://gtmf6gu4oefrax4leuigzh76ia0uwzfv.lambda-url.us-east-2.on.aws/
   PROCEDURE_API_URL=http://localhost:8070/api/procedure
   EMPLOYEE_API_URL=http://localhost:3001/api/v1/employee
   PROVIDER_API_URL=http://localhost:8050/providers
   SECRET_KEY=Y2mxcvtvYq/9o80rth+2J2zI3W2/+5aGXN59BCqgYdQ=
   SQS_NOTIFICATIONS_URL=https://sqs.us-east-2.amazonaws.com/050115428314/notification-queue
   ROLE=pacientes
   COOKIE_DOMAIN=localhost
   PATIENT_NT_API_URL=http://localhost:8080/api/patient
   ```

## Usage 🚀

This application serves as a patient portal, allowing individuals to manage their healthcare interactions digitally. Key use cases include:

- **Accessing Health Information:** Patients can view their upcoming and past medical procedures, potentially including details like doctor, date, and location.
- **Appointment Management:** The system facilitates the scheduling, modification, and cancellation of medical appointments.
- **Medication and Lab Results:** Patients can access prescription details and download laboratory results.
- **Secure Authentication:** Ensures that only authenticated and authorized patients can access their sensitive health data.
- **Profile Updates:** Users can manage their personal information and security settings, such as changing their password and setting up MFA.

## Development Server ⚙️

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app automatically reloads if you change any source files.

```bash
ng serve
```

## Build 🏗️

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
ng build
```

## Running Unit Tests 🧪

Run `ng test` to execute unit tests using Vitest.

```bash
ng test
```

## Contributing 🤝

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure your code adheres to the project's linting and formatting standards.

## License ⚖️

This project does not specify a license. Please refer to the repository for any licensing information.

## Important Links 🔗

- **Repository:** [front-sm-paciente](https://github.com/oscar-alvarado24/front-sm-paciente)
- **Author:** oscar-alvarado24

## Footer 👨‍💻

© 2024 front-sm-paciente. All rights reserved.

- **Repository:** [oscar-alvarado24/front-sm-paciente](https://github.com/oscar-alvarado24/front-sm-paciente)
- **Author:** [oscar-alvarado24](https://github.com/oscar-alvarado24)

Feel free to **fork**, **star ⭐**, **like 👍**, and **create issues 🐞** if you encounter any problems!


---
**<p align="center">Generated by [ReadmeCodeGen](https://www.readmecodegen.com/)</p>**