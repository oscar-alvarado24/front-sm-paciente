import { Component, OnInit } from '@angular/core';
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
  email: String = this.storageService.getItem("email");
  codeForm: FormGroup;
  subscription: any;

  constructor(private fb: FormBuilder, private router: Router, private verifyService:VerifyService, private storageService: StorageService) {
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
      this.subscription =this.verifyService.validateCode<String>(data).subscribe({
        next:(response:ResponseVerify)=>{
          switch(response.status) {
            case 200:
              this.router.navigate(['/request-password']);
              break
            case 400:
              alert(response.message);
              this.router.navigate([this.storageService.getItem("page")]);
              break;
            default:
              const messageError = response.message + response.body;
              alert(messageError)
          }
        },
        error:(error)=>{
          console.error('Error al generar el codigo',error)
          const messageError = error.error.message + error.error.body.body;
          alert(messageError)
          if(error.error.body.name === "DontGenerateCodeException"){
            this.router.navigate([this.storageService.getItem("page")]);
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
