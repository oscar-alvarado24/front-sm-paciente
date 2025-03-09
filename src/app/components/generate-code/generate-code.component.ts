import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { VerifyService } from 'src/app/service/verify/verify.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';
import { PatientService } from 'src/app/login-process/service/patient/patient.service';


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
