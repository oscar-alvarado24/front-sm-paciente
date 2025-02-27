import { Component, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-code-totp',
  templateUrl: './code-totp.component.html',
  styleUrls: ['./code-totp.component.css']
})
export class CodeTotpComponent {
  @Output() codeValue = new EventEmitter<string>()
  @Output() codeValid = new EventEmitter<boolean>()
  @Input() reset: boolean = false;

  codeForm: FormGroup
  constructor(
    private readonly fb: FormBuilder
  ){
    this.codeForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(6),
        Validators.maxLength(6)
      ]]
    });
    this.codeForm.valueChanges.subscribe(value => {
      if (this.codeForm.valid) {
        const codeValue = this.codeForm.controls['code'].value;  
        this.codeValue.emit(codeValue);
        this.codeValid.emit(true);
      } else{
        this.codeValid.emit(false);
      }
    });
  }

  get code(){
    return this.codeForm.get('code')
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reset'] && changes['reset'].currentValue === true) {
      this.code?.reset();
    }
  }
}
