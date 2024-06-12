import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from 'src/app/service/patient/patient.service';


@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.css']
})
export class ValidateEmailComponent {
  emailForm: FormGroup;
  subscription: any;


  constructor(private fb: FormBuilder, private servicePatient: PatientService) {
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
