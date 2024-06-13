import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/service/patient/patient.service';


@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.css']
})
export class ValidateEmailComponent {
  emailForm: FormGroup;
  subscription: any;


  constructor(private fb: FormBuilder, private servicePatient: PatientService, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Método para manejar el envío del formulario
  onSubmit() {
    if (this.emailForm.valid) {
      console.log('Email válido:', this.emailForm.value);
      const emailToSend = this.emailForm.value.email;
      this.subscription = this.servicePatient.validateEmail(emailToSend).subscribe({
        next: (validateEmail) => {
          console.log(validateEmail);
          switch (validateEmail){
            case 'email_registrado':
            this.router.navigate(['/request-password']);
            break;
          case 'email_no_registrado':
            alert('Correo no registrado, verifica la información ingresada.');
            break;
          default:
            alert('Error interno.');
            break;

          }
        },
        error: (error) => {
          console.error('Error al validar el email:', error);
        }
      });
    }

    else {
      console.log('Email no válido');
    }
  }
  get email() {
    return this.emailForm.get('email');
  }


  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
