import { Component } from '@angular/core';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-request-password',
  templateUrl: './request-password.component.html',
  styleUrls: ['./request-password.component.css']
})
export class RequestPasswordComponent {

  data: any;
  isLoading: boolean = false;
  errorMessage: string = '';
  email: string = '';

  constructor(private apiService: ApiService) {}

  fetchData(): void {
    if (!this.email) {
      this.errorMessage = 'Por favor ingrese un correo.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.apiService.getData(this.email).subscribe({
      next: response => {
        this.data = response;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error al consumir el API', error);
        this.errorMessage = error.message || 'Error al consumir el API';
        this.isLoading = false;
      }
    });
  }
}
