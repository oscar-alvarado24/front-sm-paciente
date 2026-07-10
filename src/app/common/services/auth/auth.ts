import { Injectable } from '@angular/core';
import {
  confirmSignIn,
  signIn,
  resetPassword,
  type ResetPasswordOutput,
  confirmResetPassword,
  ConfirmResetPasswordInput,
  fetchAuthSession,
  signOut,
} from '@aws-amplify/auth';
import { CognitoResponse, CognitoResponseWithNextStep } from './interface/cognito-response';
import { PasswordChangeResponse } from './interface/password-change-response';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ========================== SIGN IN ==========================
  async signIn(
    username: string,
    password: string,
  ): Promise<CognitoResponseWithNextStep | undefined> {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });

      return { isSignedIn, nextStep };
    } catch (error: unknown) {
      console.error(error);
      let message;
      const errorName = this.getErrorName(error);
      if (errorName == 'NotAuthorizedException') {
        message = 'usuario y/o contraseña incorrecta, vuelve a intentarlo';
      } else if (errorName == 'UserAlreadyAuthenticatedException') {
        this.signOut().catch((signOutError) => {
          console.error('Error al cerrar sesión:', signOutError);
        });
        message = 'Usuario ya autenticado, se cerrará la sesión actual y vuelve a intentarlo';
      } else {
        message = 'Error interno, intenta mas tarde';
      }
      alert(message);
      return undefined;
    }
  }

  // ==================== COMPLETE NEW PASSWORD ====================
  async completeNewPasswordChallenge(newPassword: string): Promise<CognitoResponseWithNextStep> {
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse: newPassword,
      });
      return { isSignedIn, nextStep };
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  }

  // ==================== ENABLE TOTP ====================
  async enableTOTP(email: string, secretCode: string): Promise<string> {
    try {
      const totpURL = `otpauth://totp/${email}?secret=${secretCode}&issuer=Eps de colombia`;
      return totpURL;
    } catch (error: unknown) {
      console.error('Error al configurar TOTP:', error);
      throw error;
    }
  }

  // ==================== CONFIRM TOTP ====================
  async confirmTotpCode(totpCode: string): Promise<CognitoResponse | undefined> {
    try {
      const response = await confirmSignIn({ challengeResponse: totpCode });
      const nextStep = response.nextStep;
      return { nextStep };
    } catch (error: unknown) {
      console.error('Error al validar el codigo totp', error);
      const errorName = this.getErrorName(error);
      let message;
      if (errorName == 'CodeMismatchException') {
        message = 'codigo incorrecto, vuelve a intentarlo';
      } else if (errorName == 'NotAuthorizedException') {
        const response: CognitoResponse = {
          nextStep: {
            signInStep: 'INITIAL',
          },
        };
        return response;
      } else {
        message = 'Error interno, intenta mas tarde';
      }
      alert(message);
      return undefined;
    }
  }

  // ==================== RESET PASSWORD ====================
  async handleResetPassword(username: string): Promise<PasswordChangeResponse> {
    try {
      const output = await resetPassword({ username });
      return this.handleResetPasswordNextSteps(output);
    } catch (error: unknown) {
      console.error('Error en reset password:', error);
      return {
        status: 'error',
        name: this.getErrorName(error) || this.getErrorMessage(error),
      };
    }
  }

  private handleResetPasswordNextSteps(output: ResetPasswordOutput): PasswordChangeResponse {
    try {
      const { nextStep } = output;

      switch (nextStep.resetPasswordStep) {
        case 'CONFIRM_RESET_PASSWORD_WITH_CODE': {
          const codeDeliveryDetails = nextStep.codeDeliveryDetails;
          console.log(`Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`);
          break;
        }
        case 'DONE': {
          console.log('Successfully reset password.');
          break;
        }

        default: {
          return {
            status: 'error',
            name: 'opción no manejada: ' + nextStep.resetPasswordStep,
          };
        }
      }
      return {
        status: 'correct',
        name: '',
      };
    } catch (error: unknown) {
      console.error('Error procesando reset password:', error);
      return {
        status: 'error',
        name: this.getErrorName(error) || this.getErrorMessage(error),
      };
    }
  }

  // ==================== CONFIRM RESET PASSWORD ====================
  async handleConfirmResetPassword({
    username,
    confirmationCode,
    newPassword,
  }: ConfirmResetPasswordInput): Promise<PasswordChangeResponse> {
    try {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword,
      });

      return {
        status: 'correct',
        name: '',
      };
    } catch (error: unknown) {
      console.error('Error confirmando reset password:', error);
      return {
        status: 'error',
        name: this.getErrorName(error),
      };
    }
  }

  // ==================== GET CURRENT USER WITH ROLE ====================
  async getCurrentUserWithRole(): Promise<string[]> {
    try {
      const { tokens } = await fetchAuthSession();

      if (!tokens) {
        console.warn('No se encontraron tokens de autenticación');
        return [];
      }

      const idToken = tokens.idToken?.toString();

      if (!idToken) {
        console.warn('No se encontró el token de ID');
        return [];
      }

      const decodedToken = this.parseJwt(idToken);
      const groups = decodedToken['cognito:groups'];

      if (!Array.isArray(groups)) {
        return [];
      }

      return groups as string[];
    } catch (error) {
      console.error('Error al obtener el usuario o el rol', error);
      return [];
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { tokens } = await fetchAuthSession();
      return tokens?.accessToken?.toString() ?? null;
    } catch (error) {
      console.error('Error obteniendo el access token:', error);
      return null;
    }
  }

  // ==================== SIGN OUT ====================
  async signOut(): Promise<void> {
    try {
      await signOut({ global: true });
    } catch (error: unknown) {
      console.error('Error al cerrar sesión', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================
  private parseJwt(token: string): Record<string, unknown> {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        throw new Error('Token inválido');
      }
      return JSON.parse(atob(payload));
    } catch (e: unknown) {
      console.error('Error al decodificar el token', e);
      return {};
    }
  }

  private getErrorName(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof error.name === 'string'
    ) {
      return (error as { name: string }).name;
    }
    return '';
  }

  private getErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return (error as { message: string }).message;
    }
    return '';
  }
}
