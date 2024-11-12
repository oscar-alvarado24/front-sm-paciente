import { Injectable } from '@angular/core';
import { confirmSignIn, getCurrentUser, setUpTOTP, signIn, SignInOutput, signOut} from '@aws-amplify/auth';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();
  qrCodeUrl: string = "";

  async signIn(username: string, password: string): Promise<any> {
    try {
      console.log("iniciando proceso de autentificacacion")
      console.log("usuario " + username )
      console.log("contraseña " + password )
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });
      console.log("el estado de es " + isSignedIn )
      console.log("el siguiente paso es " + nextStep )
      return { isSignedIn, nextStep };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  async completeNewPasswordChallenge(newPassword: string): Promise<any> {
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse: newPassword,
      });;
      
      if (isSignedIn) {
        const user = await getCurrentUser();
        this.userSubject.next(user);
        return user;
      }

      return { isSignedIn, nextStep };
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  }

  async handleSignInResult(result: SignInOutput) {
    switch (result.nextStep.signInStep) {
      case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP': {
        const { totpSetupDetails } = result.nextStep;
        const appName = 'my_app_name';
        const setupUri = totpSetupDetails.getSetupUri(appName);
        break;
      }
    }
  }
  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      this.userSubject.next(user);
      return user;
    } catch (error) {
      this.userSubject.next(null);
      throw error;
    }
  }


  async enableTOTP() {
    try {
      const user = await getCurrentUser();
      const secretCode = await setUpTOTP();
  
      // Genera la URL TOTP
      const totpURL = `otpauth://totp/${user.username}?secret=${secretCode}&issuer=YourAppName`;
  
      // Aquí puedes convertir la URL en un código QR para que el usuario lo escanee
      this.qrCodeUrl = totpURL;
      
    } catch (error) {
      console.error('Error al configurar TOTP:', error);
    }
  }

  async signOut() {
    try {
      await signOut();
      this.userSubject.next(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }
 }





