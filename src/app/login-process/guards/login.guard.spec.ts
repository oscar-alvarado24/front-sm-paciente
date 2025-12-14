import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './login.guard';
import { AuthService } from '../../commons/service/auth/auth.service';

describe('roleGuard', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUserWithRole']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
  });

  it('should allow navigation for pacientes role to /home-patient', async () => {
    mockAuthService.getCurrentUserWithRole.and.returnValue(Promise.resolve('pacientes'));

    const route: any = {};
    const state: any = { url: '/home-patient' };

    await TestBed.runInInjectionContext(async () => {
      const result = await roleGuard(route, state);
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('should redirect pacientes to /home-patient if accessing other routes', async () => {
    mockAuthService.getCurrentUserWithRole.and.returnValue(Promise.resolve('pacientes'));

    const route: any = {};
    const state: any = { url: '/other-route' };

    await TestBed.runInInjectionContext(async () => {
      const result = await roleGuard(route, state);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home-patient']);
    });
  });

  it('should allow navigation for ADMIN role to /home-admin', async () => {
    mockAuthService.getCurrentUserWithRole.and.returnValue(Promise.resolve('ADMIN'));

    const route: any = {};
    const state: any = { url: '/home-admin' };

    await TestBed.runInInjectionContext(async () => {
      const result = await roleGuard(route, state);
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('should redirect to login for unknown roles', async () => {
    mockAuthService.getCurrentUserWithRole.and.returnValue(Promise.resolve('unknown'));

    const route: any = {};
    const state: any = { url: '/some-route' };

    await TestBed.runInInjectionContext(async () => {
      const result = await roleGuard(route, state);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  it('should redirect to login on error', async () => {
    mockAuthService.getCurrentUserWithRole.and.returnValue(
      Promise.reject(new Error('Auth error'))
    );

    const route: any = {};
    const state: any = { url: '/some-route' };

    await TestBed.runInInjectionContext(async () => {
      const result = await roleGuard(route, state);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});