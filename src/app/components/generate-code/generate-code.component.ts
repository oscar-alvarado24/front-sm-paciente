import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/service/patient/patient.service';
import { VerifyService } from 'src/app/service/verify/verify.service';
import { StorageService } from 'src/app/service/localStotarage/local-storage.service';


@Component({
  selector: 'app-generate-code',
  templateUrl: './generate-code.component.html',
  styleUrls: ['./generate-code.component.css']
})
export class GenerateCodeComponent {
  emailForm: FormGroup;
  subscription: any;


  constructor(private readonly fb: FormBuilder, private readonly servicePatient: PatientService, private readonly router: Router, private readonly verifyService: VerifyService, private readonly storageService: StorageService) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Método para manejar el envío del formulario
  onSubmit() {
    if (this.emailForm.valid) {
      const emailToSend = this.emailForm.value.email;
      this.subscription = this.servicePatient.validateEmail(emailToSend).subscribe({
        next: (validateEmail) => {
          console.log(validateEmail);
          switch (validateEmail) {
            case 'email_registrado':
              this.storageService.setItem('email', emailToSend);
              this.generate(emailToSend);
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



  generate(email: string) {
    const datos = { email: email };
    this.verifyService.generateCode<string>(datos).subscribe({
      next: () => {
        this.router.navigate(['/code']);

      },
      error: (error) => {
        console.error('Error:', error);
        const messageError = error.error.message + error.error.body;
        alert(messageError)
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
