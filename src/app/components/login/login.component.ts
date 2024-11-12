import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorageService } from 'src/app/service/localStotarage/local-storage.service';
import { AuthService } from 'src/app/service/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  currentState: string = "INITIAL"
  loginForm: FormGroup
  passwordData: { password: string, confirmPassword: string } | null = null;
  qrCodeUrl: string = "";

  constructor(private readonly fb: FormBuilder, private readonly storageService: StorageService, private readonly authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['',
        [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(6),
          Validators.maxLength(6)
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.storageService.setItem("emailField", true)
  }
  get email() {
    return this.loginForm.get('email');
  }
  get code() {
    return this.loginForm.get('code');
  }

  get password() {
    return this.loginForm.get('email');
  }

  get isEmailValid(): boolean {
    return this.email ? this.email.valid : false
  }

  get isCodeValid(): boolean {
    return this.code ? this.code.valid : false
  }

  onPasswordChange(passwordData: { password: string, confirmPassword: string }) {
    this.passwordData = passwordData;
  }

  signIn() {
    if (this.isEmailValid && this.passwordData) {
      this.authService.signIn(
        this.email?.value,
        this.passwordData.password
      ).then(response => {
        if (response.isSignedIn) {
          this.router.navigate(['/principal-home']);
        } else {
          switch (response.nextStep.signInStep) {
            case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED": console.log("Cambio de contraseña")
              alert("Debes cambiar la contraseña")
              this.currentState = "NEW_PASSWORD_REQUIRED"
              break
            case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP": console.log("autenticacion MFA")
              console.log(response)
              this.authService.enableTOTP()
              this.qrCodeUrl=this.authService.qrCodeUrl
              this.currentState = "VIEW QR"
          }
        }
      });

    }
  }

  changePassword() {
    if (this.passwordData) {
      this.authService.completeNewPasswordChallenge(this.passwordData.password).then(response => {
        if (response.nextStep.signInStep === "CONTINUE_SIGN_IN_WITH_TOTP_SETUP") {
          console.log("autenticacion MFA")
          console.log(response)
          this.currentState = "AUTENTICATION MFA"
        }
      })
    }
  }

  sendTotp() {
    if (this.isCodeValid) {
      //this.
    }
  }
}
