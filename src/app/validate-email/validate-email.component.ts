import { Component } from '@angular/core';
import { ApiService } from 'src/app/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.css']
})
export class ValidateEmailComponent {
  emailForm: FormGroup;
  data: any;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage = '';

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.emailForm.get('email');
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.emailForm.valid) {
      this.isLoading = true;
      this.apiService.sendEmail(this.emailForm.value.email).subscribe({
        next: response => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = response.message;
          } else {
            this.errorMessage = response.message;
          }
          console.log('Respuesta del servidor:', response);
        },
        error: err => {
          this.isLoading = false;
          this.errorMessage = 'Ocurrió un error al enviar el correo.';
          console.error('Error del servidor:', err);
        }
      });
    } else {
      this.errorMessage = 'Por favor, introduce un correo válido.';
    }
  }
}
