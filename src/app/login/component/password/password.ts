import { Component, forwardRef, inject, DestroyRef, signal, output } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SHARED_IMPORTS } from '../../../common/shared-imports';

@Component({
  selector: 'app-password',
  imports: [SHARED_IMPORTS],
  templateUrl: './password.html',
  styleUrl: './password.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Password),
      multi: true
    }
  ]
})
export class Password  implements ControlValueAccessor {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly passwordsValue = output<{ password: string; confirmPassword: string }>();
  readonly passwordValid = output<boolean>();

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(25), this.passwordValidator()]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordMatchValidator }
  );

  private onChange: (value: { password: string; confirmPassword: string }) => void = () => {
    // Se sobrescribe en registerOnTouched()
  };
  private onTouched: () => void = () => {
    // Se sobrescribe en registerOnTouched()
    };

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (this.form.valid) {
          this.passwordsValue.emit(value as { password: string; confirmPassword: string });
          this.passwordValid.emit(true);
        } else {
          this.passwordValid.emit(false);
        }
      });
  }

  passwordValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      const hasNumber = /\d/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const valid = hasNumber && hasUpper && hasLower && hasSpecial;
      return valid ? null : { pattern: true };
    };
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update(value => !value);
    } else {
      this.showConfirmPassword.update(value => !value);
    }
  }

  writeValue(value: { password: string; confirmPassword: string }): void {
    if (value) {
      this.form.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: { password: string; confirmPassword: string }) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.form[isDisabled ? 'disable' : 'enable']();
  }
}

