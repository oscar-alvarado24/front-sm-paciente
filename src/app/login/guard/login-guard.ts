import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, catchError, of } from 'rxjs';
import { AuthService } from '../../common/services/auth/auth';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export const loginGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);


  if (!isPlatformBrowser(platformId)) {
    return true;
  }

    const router = inject(Router);
  const authService = inject(AuthService);

  return from(authService.getCurrentUserWithRole()).pipe(
    map(userRoles => {
      if (userRoles?.includes(environment.role)) {
        return true;
      }
      alert('No tienes permisos para ingresar');
      forceRedirectToLogin(router);
      return false;
    }),
    catchError(error => {
      console.error('Error en la validación del guard', error);
      forceRedirectToLogin(router);
      return of(false);
    })
  );
};

function forceRedirectToLogin(router: Router): void {
  router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    router.navigate(['/login']);
  });
}