import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.css']
})
export class ValidateEmailComponent {
  emailForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Método para manejar el envío del formulario
  onSubmit() {
    if (this.emailForm.valid) {
      console.log('Email válido:', this.emailForm.value);
    } else {
      console.log('Email no válido');
    }
  }
  get email() {
    return this.emailForm.get('email');
  }
}
