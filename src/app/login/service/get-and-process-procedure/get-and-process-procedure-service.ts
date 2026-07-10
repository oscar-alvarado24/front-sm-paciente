import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, switchMap, tap, timeout } from 'rxjs/operators';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { CryptoService } from '../../../common/services/crypto/crypto';
import { Doctor } from '../../../common/services/employee/interface/employees';
import { MedicalProcedure } from '../../../common/services/procedure/interface/medical-procedure';
import { Branch } from '../../../common/services/provider/interface/branch';
import { EmployeeService } from '../../../common/services/employee/employee';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { ProcedureService } from '../../../common/services/procedure/procedure';
import { ProviderService } from '../../../common/services/provider/provider';
import { OrganiceDataService } from '../../../home/component/procedures-target/service/organice-data';
import { PatientWtService } from '../../../common/services/graphql/services/patient-wt';

@Injectable({ providedIn: 'root' })
export class GetAndProcessProcedureService {
  private readonly procedureService = inject(ProcedureService);
  private readonly storageService = inject(LocalStorageService);
  private readonly employeeService = inject(EmployeeService);
  private readonly providerService = inject(ProviderService);
  private readonly cryptoService = inject(CryptoService);
  private readonly patientService = inject(PatientWtService);
  private readonly organiceDataService = inject(OrganiceDataService);

  private procedureData: MedicalProcedure[] = [];
  private doctorData: Doctor[] = [];
  private branchData: Branch[] = [];
  private readonly doctorProcedureMap = new Map<string, string>();
  private readonly companyMap = new Map<string, string>();

  startFlowForGetProcedures(): Observable<FlowResult> {
    console.log('🏥 [PROCEDURES] Iniciando flujo');
    this.clearPreviousData();

    const initialEmail: string = this.storageService.getItem('email') || '';

    if (!initialEmail || initialEmail.trim() === '') {
      console.error('❌ [PROCEDURES] No hay email en el storage');
      this.setErrorMessages();
      return of({ complete: false, error: 'Email no disponible' });
    }

    return from(this.cryptoService.encryptAsync(initialEmail)).pipe(
      switchMap((encryptedEmail: string) =>
        this.patientService.getPatient(encryptedEmail).pipe(
          timeout(10000),
          switchMap((patientData) => {
            console.log('👤 [PATIENT] Datos del paciente obtenidos:', patientData);
            if (!patientData) {
              throw new Error('Paciente no encontrado');
            }
            const patientId: number = patientData.id;
            if (!patientId) {
              throw new Error('ID de paciente inválido');
            }

            return from(
              Promise.all([
                this.cryptoService.encryptAsync(patientId.toString(), 'local_encrypt'),
                this.cryptoService.encryptAsync(patientData.photo || '', 'local_encrypt'),
                this.cryptoService.encryptAsync(patientData.cellphone || '', 'local_encrypt'),
                this.cryptoService.encryptAsync(patientData.firstName || '', 'local_encrypt'),
                this.cryptoService.encryptAsync(patientData.firstSurname || '', 'local_encrypt'),
              ]),
            ).pipe(
              switchMap(([encPatient, encPhoto, encCellphone, encName, encLastname]) => {
                this.storageService.setItem('patient', encPatient);
                this.storageService.setItem('photo', encPhoto);
                this.storageService.setItem('cellphone', encCellphone);
                this.storageService.setItem('name', encName);
                this.storageService.setItem('lastname', encLastname);
                console.debug('🆔 [PATIENT] ID guardado en storage:', patientId);

                return this.procedureService.getProceduresByPatientId(encPatient).pipe(
                  timeout(15000),
                  tap((procedures) =>
                    console.log(
                      `📋 [PROCEDURES] Obtenidos: ${procedures?.length ?? 0} procedimientos`,
                    ),
                  ),
                  switchMap((procedures: MedicalProcedure[]) => {
                    if (!procedures?.length) {
                      console.log('ℹ️ [PROCEDURES] No hay procedimientos');
                      this.setEmptyProceduresMessages();
                      return of<FlowResult>({ complete: true, message: 'No hay procedimientos' });
                    }
                    this.procedureData = procedures;
                    return this.consultDoctorsAndBranchesData(procedures);
                  }),
                );
              }),
            );
          }),
        ),
      ),
      tap({
        next: (result) => console.log('✅ [PROCEDURES] Flujo completado:', result),
        error: (error) => console.error('❌ [PROCEDURES] Error en el flujo:', error),
      }),
      finalize(() => {
        console.log('🏁 [PROCEDURES] Finalizando, verificando storage...');
        this.ensureStorageDefaults();
      }),
      catchError((error) => {
        if (error?.status === 404 || error?.error?.status === 404) {
          this.setEmptyProceduresMessages();
          return of<FlowResult>({ complete: true, message: 'No hay procedimientos' });
        }
        console.error('❌ [PROCEDURES] Error crítico:', error);
        this.setErrorMessages();
        return of<FlowResult>({ complete: false, error: error.message ?? 'Error desconocido' });
      }),
    );
  }

  private consultDoctorsAndBranchesData(procedures: MedicalProcedure[]): Observable<FlowResult> {
    console.log('👨‍⚕️ [DOCTORS] Iniciando consulta de doctores');

    const encryptedDoctorIds = [...new Set(procedures.map((p) => p.doctorId))];

    if (!encryptedDoctorIds.length) {
      console.error('❌ [DOCTORS] No hay doctorIds en los procedimientos');
      this.setErrorMessages();
      return of({ complete: false, error: 'No hay doctorIds' });
    }

    const decryptObservables = encryptedDoctorIds.map((encryptedId, index) =>
      from(this.cryptoService.decryptAsync(encryptedId)).pipe(
        timeout(5000),
        tap((decrypted) => {
          if (decrypted) {
            this.doctorProcedureMap.set(encryptedId, decrypted);
            console.log(`✅ [DOCTORS] [${index + 1}/${encryptedDoctorIds.length}] ID mapeado`);
          }
        }),
        map((decrypted) => {
          const num = Number(decrypted);
          if (Number.isNaN(num)) {
            console.warn(`⚠️ [DOCTORS] ID no numérico: ${decrypted}`);
            return null;
          }
          return num;
        }),
        catchError((err) => {
          console.error(`❌ [DOCTORS] Error desencriptando [${index + 1}]:`, err.message);
          return of(null);
        }),
      ),
    );

    return forkJoin(decryptObservables).pipe(
      timeout(20000),

      map((ids) => [
        ...new Set(ids.filter((id): id is number => id !== null && !Number.isNaN(id))),
      ]),

      switchMap((doctorIds) => {
        if (!doctorIds.length) {
          console.error('❌ [DOCTORS] No se pudieron desencriptar doctorIds');
          this.setErrorMessages();
          return of<FlowResult>({
            complete: false,
            error: 'No se pudieron desencriptar doctorIds',
          });
        }
        return this.employeeService.getDoctorByIds(doctorIds).pipe(
          timeout(10000),
          tap((doctors) =>
            console.log(`✅ [DOCTORS] API respondió: ${doctors?.length ?? 0} doctores`),
          ),
          catchError((err) =>
            throwError(() => new Error('Error consultando doctores: ' + err.message)),
          ),
        );
      }),

      switchMap((doctors) => {
        if (!Array.isArray(doctors) || !doctors.length) {
          console.error('❌ [DOCTORS] Respuesta inválida o vacía');
          this.setErrorMessages();
          return of<FlowResult>({ complete: false, error: 'No se obtuvieron doctores' });
        }
        this.doctorData = doctors;
        return this.getBranchesData(doctors);
      }),

      catchError((error) => {
        console.error('❌ [DOCTORS] Error en flujo de doctores:', error);
        this.setErrorMessages();
        return of<FlowResult>({ complete: false, error: error.message ?? 'Error en doctores' });
      }),
    );
  }

  private getBranchesData(doctors: Doctor[]): Observable<FlowResult> {
    console.log('🏢 [BRANCHES] Iniciando consulta de sucursales');

    const encryptedCompanies = [...new Set(doctors.map((d) => d.company))];

    if (!encryptedCompanies.length) {
      console.error('❌ [BRANCHES] No hay companies en los doctores');
      this.setErrorMessages();
      return of({ complete: false, error: 'No hay companies' });
    }

    const decryptObservables = encryptedCompanies.map((encrypted, index) =>
      from(this.cryptoService.decryptAsync(encrypted)).pipe(
        timeout(5000),
        map((decrypted) => {
          console.log(`✅ [BRANCHES] [${index + 1}/${encryptedCompanies.length}] Company mapeado`);
          return { encrypted, decrypted: decrypted.toString() };
        }),
        catchError((err) => {
          console.error(`❌ [BRANCHES] Error desencriptando [${index + 1}]:`, err.message);
          return of(null);
        }),
      ),
    );

    return forkJoin(decryptObservables).pipe(
      timeout(20000),

      map((results) => {
        results.forEach((result) => {
          if (result) this.companyMap.set(result.encrypted, result.decrypted);
        });
        console.log(`🟢 [BRANCHES] ${this.companyMap.size} companies mapeados`);

        const keySet = new Set<string>();
        doctors.forEach((doc) => {
          const decryptedCompany = this.companyMap.get(doc.company);
          if (decryptedCompany && doc.workplace) {
            keySet.add(`${decryptedCompany} | ${doc.workplace}`);
          } else {
            console.warn('⚠️ [BRANCHES] Doctor sin company/workplace válido:', doc);
          }
        });
        return [...keySet];
      }),

      switchMap((keys) => {
        if (!keys.length) {
          console.error('❌ [BRANCHES] No se pudieron crear keys');
          this.setErrorMessages();
          return of<FlowResult>({ complete: false, error: 'No se pudieron crear keys' });
        }
        return this.providerService.getBranchesByIds(keys).pipe(
          timeout(30000),
          tap((branches) =>
            console.log(`✅ [BRANCHES] API respondió: ${branches?.length ?? 0} sucursales`),
          ),
          catchError((err) => {
            console.error('❌ [BRANCHES] Error en API:', err);
            return of([]);
          }),
        );
      }),

      switchMap((branches) => {
        this.branchData = Array.isArray(branches) ? (branches as Branch[]) : [];
        console.log(`📍 [ORGANIZE] Organizando con ${this.branchData.length} branches`);
        return this.organizeAndSaveProcedures();
      }),

      catchError((error) => {
        console.error('❌ [BRANCHES] Error en flujo de branches:', error);
        this.setErrorMessages();
        return of<FlowResult>({ complete: false, error: error.message ?? 'Error en branches' });
      }),
    );
  }

  private organizeAndSaveProcedures(): Observable<FlowResult> {
    console.log('📊 [ORGANIZE] Organizando procedimientos');

    if (!this.procedureData.length) {
      this.setErrorMessages();
      return of<FlowResult>({ complete: false, error: 'No hay procedureData' });
    }

    if (!this.doctorData.length) {
      this.setErrorMessages();
      return of<FlowResult>({ complete: false, error: 'No hay doctorData' });
    }

    try {
      const result = this.organiceDataService.createTargetProcedureList(
        this.procedureData,
        this.doctorData,
        this.branchData,
        this.doctorProcedureMap,
        this.companyMap,
      );

      const result$ = result as unknown;
      if (result$ && typeof (result$ as Observable<unknown>).subscribe === 'function') {
        return (result$ as Observable<unknown>).pipe(
          map(() => {
            console.log('✅ [ORGANIZE] Procedimientos organizados (async)');
            return { complete: true };
          }),
          catchError((err) => {
            console.error('❌ [ORGANIZE] Error organizando:', err);
            this.setErrorMessages();
            return of<FlowResult>({ complete: false, error: err.message });
          }),
        );
      }

      console.log('✅ [ORGANIZE] Procedimientos organizados (sync)');
      return of<FlowResult>({
        complete: true,
        message: 'Procedimientos organizados correctamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error organizando datos';
      console.error('❌ [ORGANIZE] Error en organización:', error);
      this.setErrorMessages();
      return of<FlowResult>({ complete: false, error: message });
    }
  }

  private clearPreviousData(): void {
    this.procedureData = [];
    this.doctorData = [];
    this.branchData = [];
    this.doctorProcedureMap.clear();
    this.companyMap.clear();
    this.storageService.removeItem('upcomingProcedures');
    this.storageService.removeItem('lastProcedures');
  }

  private setEmptyProceduresMessages(): void {
    this.storageService.setItem('upcomingProcedures', 'No hay procedimientos programados');
    this.storageService.setItem('lastProcedures', 'No hay procedimientos anteriores');
  }

  private setErrorMessages(): void {
    this.storageService.setItem(
      'upcomingProcedures',
      'Error al consultar los procedimientos, intenta más tarde',
    );
    this.storageService.setItem(
      'lastProcedures',
      'Error al consultar los procedimientos, intenta más tarde',
    );
  }

  private ensureStorageDefaults(): void {
    const fallback = 'Error: no se pudo procesar la información, intenta más tarde';
    if (!this.storageService.getItem('upcomingProcedures')) {
      this.storageService.setItem('upcomingProcedures', fallback);
      console.warn('⚠️ [STORAGE] upcomingProcedures vacío, estableciendo default');
    }
    if (!this.storageService.getItem('lastProcedures')) {
      this.storageService.setItem('lastProcedures', fallback);
      console.warn('⚠️ [STORAGE] lastProcedures vacío, estableciendo default');
    }
  }
}

interface FlowResult {
  complete: boolean;
  message?: string;
  error?: string;
}
