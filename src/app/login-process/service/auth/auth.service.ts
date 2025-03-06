import { Injectable } from '@angular/core';
import { confirmSignIn, signIn, resetPassword, type ResetPasswordOutput, confirmResetPassword, ConfirmResetPasswordInput, fetchAuthSession } from '@aws-amplify/auth';
import { CognitoResponse } from 'src/app/login-process/model/cognito-response';
import { PasswordChangeResponse } from '../../model/password-change-response';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  qrCodeUrl: string = "";

  async signIn(username: string, password: string): Promise<any> {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });

      return { isSignedIn, nextStep };
    } catch (error: any) {

      console.error(error);
      let message;
      if (error.name == "NotAuthorizedException") {
        message = "usuario y/o contraseña incorrecta, vuelve a intentarlo"
      } else {
        message = "Error interno, intenta mas tarde"
      }
      alert(message)
    }
  }

  async completeNewPasswordChallenge(newPassword: string): Promise<any> {
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse: newPassword,
      });;
      return { isSignedIn, nextStep };
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  }


  async enableTOTP(email: string, secretCode: string) {
    try {
      console.log("enable TOTP process")

      // Genera la URL TOTP
      const totpURL = `otpauth://totp/${email}?secret=${secretCode}&issuer=Eps de Colombia`;

      // Aquí puedes convertir la URL en un código QR para que el usuario lo escanee
      this.qrCodeUrl = totpURL;

    } catch (error) {
      console.error('Error al configurar TOTP:', error);
    }
  }

  async confirmTotpCode(totpCode: string): Promise<any> {
    try {
      const response = await confirmSignIn({ challengeResponse: totpCode });
      const nextStep = response.nextStep
      return { nextStep };
    } catch (error: any) {
      console.error("Error al validar el codigo totp", error)
      let message;
      if (error.name == "CodeMismatchException") {
        message = "codigo incorrecto, vuelve a intentarlo"
      } else if (error.name == "NotAuthorizedException") {
        const response: CognitoResponse = {
          nextStep: {
            signInStep: "INITIAL"
          }
        };
        return response;
      } else {
        message = "Error interno, intenta mas tarde"
      }
      alert(message)
    }
  }

  async handleResetPassword(username: string): Promise<PasswordChangeResponse> {
    try {
      console.log("username: ", username)
      const output = await resetPassword({ username });
      return this.handleResetPasswordNextSteps(output);
    } catch (error: any) {
      console.log(error);
      const response: PasswordChangeResponse = {
        status: "error",
        name: error.name
      }
      return response;
    }
  }

  handleResetPasswordNextSteps(output: ResetPasswordOutput): PasswordChangeResponse {
    try {
      const { nextStep } = output;
      switch (nextStep.resetPasswordStep) {
        case 'CONFIRM_RESET_PASSWORD_WITH_CODE': {
          const codeDeliveryDetails = nextStep.codeDeliveryDetails;
          console.log(
            `Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`
          );
          console.log(nextStep);
          // Collect the confirmation code from the user and pass to confirmResetPassword.
          break;
        }
        case 'DONE': {
          console.log('Successfully reset password.');
          break;
        }
      }
      const response: PasswordChangeResponse = {
        status: "correct",
        name: ""
      }
      return response;
    } catch (error: any) {
      console.error(error)
      const response: PasswordChangeResponse = {
        status: "error",
        name: error.name
      }
      return response;
    }
  }

  async handleConfirmResetPassword({
    username,
    confirmationCode,
    newPassword
  }: ConfirmResetPasswordInput): Promise<any> {
    try {
      await confirmResetPassword({ username, confirmationCode, newPassword });
      const response: PasswordChangeResponse = {
        status: "correct",
        name: ""
      }
      return response;
    } catch (error: any) {
      console.log(error);
      const response: PasswordChangeResponse = {
        status: "error",
        name: error.name
      }
      return response;
    }
  }

  // Función para obtener el rol del usuario
async getCurrentUserWithRole(): Promise<string> {
  try {

    // Obtener la sesión de autenticación para acceder a los tokens
    const { tokens } = await fetchAuthSession();

    // Verificar si hay tokens
    if (!tokens) {
      console.warn('No se encontraron tokens de autenticación');
      return '';
    }

    // Decodificar el token de ID
    const idToken = tokens.idToken?.toString();

    if (!idToken) {
      console.warn('No se encontró el token de ID');
      return '';
    }

    // Extraer el rol desde los tokens o claims
    // Puedes ajustar esto según la estructura específica de tus tokens
    const decodedToken = parseJwt(idToken);

    // Extraer el rol de diferentes posibles ubicaciones
    const userRole =
      decodedToken['cognito:groups']?.[0] || // Grupos de Cognito
      '';

    console.log('Rol del usuario:', userRole);
    return userRole;

  } catch (error) {
    console.error('Error al obtener el usuario o el rol', error);
    return '';
  }
}
}
// Función para decodificar JWT
function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Error al decodificar el token', e);
    return {};
  }
}