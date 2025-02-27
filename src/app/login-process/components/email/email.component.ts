import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.css']
})
export class EmailComponent {
  @Output() emailValid = new EventEmitter<boolean>()
  @Output() emailValue = new EventEmitter<string>()

  emailForm: FormGroup;
  constructor(
    private readonly fb: FormBuilder
  ){
    this.emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
    })
    this.emailForm.valueChanges.subscribe(value => {
      if (this.emailForm.valid) {
        const emailValue = this.emailForm.controls['email'].value;  
        this.emailValue.emit(emailValue);
        this.emailValid.emit(true);
      } else{
        this.emailValid.emit(false);
      }
    });
  }

  
  /** @returns Control del campo email del formulario */
  get email() {
    return this.emailForm.get('email');
  }

}
