import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.css']
})
export class RecoverPasswordComponent {
  /** Valor del email del usuario para referencia durante el flujo de autenticación */
  emailValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el email*/
  isEmailValid: boolean = false;

  /**
     * @description Inicializa el componente y configura el formulario reactivo
     * @param authService Servicio para manejar la autenticación
     * @param router Servicio para la navegación
     */
    constructor(
      private readonly authService: AuthService,
      private readonly router: Router
    ) {
      this.authService = authService;
      this.router = router;
    }
  
    /**
     * @description Maneja los cambios de estado en el cumplimiento de las condicionales del email desde el componente hijo
     * @param emailIsValid Objeto con el valor del estado del cumplimiento de las condicionales del email
     */
    onEmailValid(emailIsValid: boolean) {
      this.isEmailValid = emailIsValid;
    }
  
    /**
     * @description Maneja los cambios en el email desde el componente hijo
     * @param email Objeto con el email
     */
    onEmailValue(email: string) {
      this.emailValue = email;
    }

    recoverPassword(){
      this.authService.handleResetPassword(this.emailValue).then(response =>{
        console.log(response)
        if (response.status == "correct"){
          this.router.navigate(['change-password']);
        }else{
          alert("Error interno intenta mas tarde")
        }
      });
    }

}
