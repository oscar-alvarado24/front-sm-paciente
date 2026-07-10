import { Component, output, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SHARED_IMPORTS } from '../../../common/shared-imports';

interface EmailForm {
  email: FormControl<string>;
}

@Component({
  selector: 'app-email',
  imports: [SHARED_IMPORTS],
  templateUrl: './email.html',
  styleUrl: './email.scss',
})
export class Email {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly emailValid = output<boolean>();
  readonly emailValue = output<string>();

  readonly emailForm: FormGroup<EmailForm> = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor() {
    this.emailForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.emailForm.valid) {
          const emailValue = this.emailForm.controls.email.value;
          this.emailValue.emit(emailValue ?? '');
          this.emailValid.emit(true);
        } else {
          this.emailValid.emit(false);
        }
      });
  }

  /** @returns Control del campo email del formulario */
  get email() {
    return this.emailForm.controls.email;
  }
}
