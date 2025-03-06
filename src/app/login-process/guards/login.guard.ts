import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService)

  return from(authService.getCurrentUserWithRole()).pipe(
    switchMap(userRole => {

      // Lógica de redirección basada en roles
      switch (userRole) {
        case 'pacientes':
          if (state.url !== '/home-patient') {
            router.navigate(['/home-patient']);
            return of(false);
          }
          return of(true);

        case 'ADMIN':
          if (state.url !== '/home-admin') {
            router.navigate(['/home-admin']);
            return of(false);
          }
          return of(true);

        default:
          router.navigate(['/login']);
          return of(false);
      }
    }),
    catchError(error => {
      console.error('Error en la validación del guard', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};

