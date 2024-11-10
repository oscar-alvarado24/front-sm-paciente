import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VerifyService } from 'src/app/service/verify/verify.service';
import { ResponseVerify } from 'src/app/model/response-verify';
import { StorageService } from 'src/app/service/localStotarage/local-storage.service';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})
export class CodeComponent {
  email: string = this.storageService.getItem("email");
  codeForm: FormGroup;
  subscription: any;

  constructor(private readonly fb: FormBuilder, private readonly router: Router, private readonly verifyService:VerifyService, private readonly storageService: StorageService) {
    this.codeForm = this.fb.group({
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

  
  onSubmit() {
    if (this.codeForm.valid) {
      console.log('Formulario válido', this.codeForm.value);
      console.log('El email es ', this.email)

      const data ={
        email:this.email,
        code:this.codeForm.value.code
      }
      this.subscription =this.verifyService.validateCode<string>(data).subscribe({
        next:(response:ResponseVerify)=>{
          switch(response.status) {
            case 200:
              this.router.navigate(['/change-password']);
              this.storageService.setItem("emailField",false)
              break
            case 400:
              alert(response.message);
              this.router.navigate(['/generate-code']);
              break;
            default:{
              const messageError = `${response.message || ''}${response.body != null ? String(response.body) : ''}`;
              alert(messageError)
            }
          }
        },
        error:(error)=>{
          console.error('Error al generar el codigo',error)
          const messageError = error.error.message + error.error.body.body;
          alert(messageError)
          if(error.error.body.name === "DontGenerateCodeException"){
            this.router.navigate(['/generate-code']);
          }
        }
      })

    } else {
      console.log('Formulario no válido');
    }
  }
  get code() {
    return this.codeForm.get('code');
  }
}
