import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/service/patient/patient.service';
import { VerifyService } from 'src/app/service/verify/verify.service';
import { StorageService } from 'src/app/service/localStotarage/local-storage.service';


@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.css']
})
export class ValidateEmailComponent implements OnInit{
  emailForm: FormGroup;
  subscription: any;


  constructor(private fb: FormBuilder, private servicePatient: PatientService, private router: Router, private verifyService: VerifyService, private storageService: StorageService) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  ngOnInit(): void {
    this.storageService.setItem('page', '/validate-email');
  }

  // Método para manejar el envío del formulario
  onSubmit() {
    if (this.emailForm.valid) {
      console.log('Email válido:', this.emailForm.value);
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



  generate(email: String) {
    const datos = { email: email };
    this.verifyService.generateCode<String>(datos).subscribe({
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
