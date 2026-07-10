import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormGroup,  Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { SHARED_IMPORTS } from '../../../common/shared-imports';

interface CodeForm {
  code: FormControl<string>;
}

@Component({
  selector: 'app-code-totp',
  imports: [SHARED_IMPORTS],
  templateUrl: './code-totp.html',
  styleUrl: './code-totp.scss',
})
export class CodeTotp implements OnChanges {
  @Output() codeValue = new EventEmitter<string>();
  @Output() codeValid = new EventEmitter<boolean>();
  @Input() reset = false;

  private readonly fb = inject(NonNullableFormBuilder);
  codeForm: FormGroup<CodeForm> = this.fb.group({
    code: ['', [
      Validators.required,
      Validators.pattern('^[0-9]*$'),
      Validators.minLength(6),
      Validators.maxLength(6)
    ]]
  });

  constructor() {
    this.codeForm.valueChanges.subscribe(() => {
      if (this.codeForm.valid) {
        const codeValue = this.codeForm.controls['code']!.value as string;
        this.codeValue.emit(codeValue);
        this.codeValid.emit(true);
      } else {
        this.codeValid.emit(false);
      }
    });
  }

  get code() {
    return this.codeForm.controls.code;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reset']?.currentValue === true) {
      this.code?.reset();
    }
  }
}
