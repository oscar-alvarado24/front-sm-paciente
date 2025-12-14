import { Injectable } from '@angular/core';
import { ProcedureService } from '../../../commons/service/procedure/service/procedure.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { catchError, finalize, map, switchMap, tap, timeout } from 'rxjs/operators';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';
import { Doctor } from '../../../commons/service/employee/interface/employee';
import { Branch } from '../../../commons/service/provider/interface/provider';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { EmployeeService } from '../../../commons/service/employee/service/employee.service';
import { ProviderService } from '../../../commons/service/provider/service/provider.service';
import { CryptoService } from '../../../commons/service/crypto/crypto.service';
import { OrganiceDataService } from '../../../patient-home/components/procedures-target/service/organice-data.service';

@Injectable({
  providedIn: 'root'
})
export class GetAndProcessProcedureService {

  procedureData: MedicalProcedure[] = [];
  doctorData: Doctor[] = [];
  branchData: Branch[] = [];
  doctorProcedureMap = new Map<string, string>();
  companyMap = new Map<string, string>();

  constructor(
    private readonly procedureService: ProcedureService,
    private readonly storageService: StorageService,
    private readonly employeeService: EmployeeService,
    private readonly providerService: ProviderService,
    private readonly cryptoService: CryptoService,
    private readonly organiceDataService: OrganiceDataService
  ) { }

  startFlowForGetProcedures(): Observable<any> {
    console.log('🏥 [PROCEDURES] Iniciando flujo');

    // Limpiar datos previos
    this.clearPreviousData();

    return this.procedureService.getProceduresByPatientId(this.storageService.getItem("patient"))
      .pipe(
        timeout(15000), // 15 segundos para la consulta inicial
        tap(procedures => console.log(`📋 [PROCEDURES] Obtenidos: ${procedures?.length || 0} procedimientos`)),

        switchMap((procedures: MedicalProcedure[]) => {
          if (!procedures || procedures.length === 0) {
            console.log('ℹ️ [PROCEDURES] No hay procedimientos');
            this.setEmptyProceduresMessages();
            return of({ complete: true, message: 'No hay procedimientos' });
          }

          this.procedureData = procedures;
          console.log('✅ [PROCEDURES] Datos guardados, consultando doctores...');

          return this.consultDoctorsAndBranchesData(procedures);
        }),

        // Asegurar valores por defecto antes del finalize
        tap({
          next: (result) => console.log('✅ [PROCEDURES] Flujo completado exitosamente:', result),
          error: (error) => console.error('❌ [PROCEDURES] Error en el flujo:', error)
        }),

        finalize(() => {
          console.log('🏁 [PROCEDURES] Finalizando, verificando storage...');
          this.ensureStorageDefaults();
        }),

        catchError(error => {
          console.error('❌ [PROCEDURES] Error crítico:', error);
          console.log('❌ [PROCEDURES] Error status:', error?.status);
          console.log('❌ [PROCEDURES] Error completo:', JSON.stringify(error));

          // Si es 404, no hay procedimientos
          if (error?.status === 404 || error?.error?.status === 404) {
            console.log('ℹ️ [PROCEDURES] 404 - No hay procedimientos para este paciente');
            this.setEmptyProceduresMessages();
            return of({ complete: true, message: 'No hay procedimientos' });
          }
          this.setErrorMessages();
          return of({ complete: false, error: error.message || 'Error desconocido' });
        })
      );
  }

  private consultDoctorsAndBranchesData(procedures: MedicalProcedure[]): Observable<any> {
    console.log('👨‍⚕️ [DOCTORS] Iniciando consulta de doctores');

    const encryptedDoctorIds: string[] = [...new Set(procedures.map(p => p.doctorId))];
    console.log(`🔵 [DOCTORS] IDs únicos a desencriptar: ${encryptedDoctorIds.length}`);

    // Validar que hay IDs
    if (encryptedDoctorIds.length === 0) {
      console.error('❌ [DOCTORS] No hay doctorIds en los procedimientos');
      this.setErrorMessages();
      return of({ complete: false, error: 'No hay doctorIds' });
    }

    // Desencriptar IDs en paralelo
    const decryptObservables = encryptedDoctorIds.map((encryptedId, index) =>
      from(this.cryptoService.decryptAsync(encryptedId)).pipe(
        timeout(5000), // 5 segundos por desencriptación
        tap(decrypted => {
          if (decrypted) {
            this.doctorProcedureMap.set(encryptedId, decrypted);
            console.log(`✅ [DOCTORS] [${index + 1}/${encryptedDoctorIds.length}] ID mapeado`);
          }
        }),
        map(decrypted => {
          const num = Number(decrypted);
          if (isNaN(num)) {
            console.warn(`⚠️ [DOCTORS] ID desencriptado no es numérico: ${decrypted}`);
            return null;
          }
          return num;
        }),
        catchError(err => {
          console.error(`❌ [DOCTORS] Error desencriptando ID [${index + 1}]:`, err.message);
          return of(null);
        })
      )
    );

    return forkJoin(decryptObservables).pipe(
      timeout(20000), // 20 segundos para todas las desencriptaciones

      map(ids => {
        const filteredIds = ids.filter(id => id !== null && !isNaN(id)) as number[];
        const uniqueIds = [...new Set(filteredIds)];
        console.log(`🟢 [DOCTORS] IDs válidos únicos: ${uniqueIds.length} de ${ids.length}`);
        return uniqueIds;
      }),

      switchMap(doctorIds => {
        if (doctorIds.length === 0) {
          console.error('❌ [DOCTORS] No se pudieron desencriptar doctorIds');
          this.setErrorMessages();
          return of({ complete: false, error: 'No se pudieron desencriptar doctorIds' });
        }

        console.log(`🔍 [DOCTORS] Consultando API con ${doctorIds.length} IDs`);
        return this.employeeService.getDoctorByIds(doctorIds).pipe(
          timeout(10000), // 10 segundos para consulta de doctores
          tap(doctors => console.log(`✅ [DOCTORS] API respondió: ${doctors?.length || 0} doctores`)),
          catchError(err => {
            console.error('❌ [DOCTORS] Error en API:', err);
            return throwError(() => new Error('Error consultando doctores: ' + err.message));
          })
        );
      }),

      switchMap((doctors) => {
        if (!Array.isArray(doctors)) {
          console.error('❌ [DOCTORS] Respuesta inválida al consultar doctores');
          this.setErrorMessages();
          return of({ complete: false, error: 'Respuesta inválida de doctores' });
        }

        if (doctors.length === 0) {
          console.error('❌ [DOCTORS] No se obtuvieron doctores de la API');
          this.setErrorMessages();
          return of({ complete: false, error: 'No se obtuvieron doctores' });
        }

        this.doctorData = doctors;
        console.log(`✅ [DOCTORS] ${doctors.length} doctores guardados, consultando branches...`);
        return this.getBranchesData(doctors);
      }),

      catchError(error => {
        console.error('❌ [DOCTORS] Error en flujo de doctores:', error);
        this.setErrorMessages();
        return of({ complete: false, error: error.message || 'Error en doctores' });
      })
    );
  }

  private getBranchesData(doctors: Doctor[]): Observable<any> {
    console.log('🏢 [BRANCHES] Iniciando consulta de sucursales');

    const encryptedCompanies: string[] = [...new Set(doctors.map(d => d.company))];
    console.log(`🔵 [BRANCHES] Companies únicos a desencriptar: ${encryptedCompanies.length}`);

    // Validar que hay companies
    if (encryptedCompanies.length === 0) {
      console.error('❌ [BRANCHES] No hay companies en los doctores');
      this.setErrorMessages();
      return of({ complete: false, error: 'No hay companies' });
    }

    // Desencriptar companies en paralelo
    const decryptObservables = encryptedCompanies.map((encrypted, index) =>
      from(this.cryptoService.decryptAsync(encrypted)).pipe(
        timeout(5000),
        map(decrypted => {
          const result = {
            encrypted,
            decrypted: decrypted.toString()
          };
          console.log(`✅ [BRANCHES] [${index + 1}/${encryptedCompanies.length}] Company mapeado`);
          return result;
        }),
        catchError(err => {
          console.error(`❌ [BRANCHES] Error desencriptando company [${index + 1}]:`, err.message);
          return of(null);
        })
      )
    );

    return forkJoin(decryptObservables).pipe(
      timeout(20000),

      map(results => {
        results.forEach(result => {
          if (result) {
            this.companyMap.set(result.encrypted, result.decrypted);
          }
        });
        console.log(`🟢 [BRANCHES] ${this.companyMap.size} companies mapeados`);
        return this.companyMap;
      }),

      map(decryptionMap => {
        const keySet = new Set<string>();
        let skippedDoctors = 0;

        doctors.forEach(doc => {
          const decryptedCompany = decryptionMap.get(doc.company);
          if (decryptedCompany && doc.workplace) {
            keySet.add(`${decryptedCompany} | ${doc.workplace}`);
          } else {
            skippedDoctors++;
            console.warn('⚠️ [BRANCHES] Doctor sin company/workplace válido:', doc);
          }
        });

        const keys = Array.from(keySet);
        console.log(`🟢 [BRANCHES] ${keys.length} keys únicos creados (${skippedDoctors} doctores omitidos)`);
        return keys;
      }),

      switchMap(keys => {
        if (keys.length === 0) {
          console.error('❌ [BRANCHES] No se pudieron crear keys');
          this.setErrorMessages();
          return of({ complete: false, error: 'No se pudieron crear keys' });
        }

        console.log(`🔍 [BRANCHES] Consultando API con ${keys.length} keys`);
        return this.providerService.getBranchesByIds(keys).pipe(
          timeout(30000),
          tap(branches => console.log(`✅ [BRANCHES] API respondió: ${branches?.length || 0} sucursales`)),
          catchError(err => {
            console.error('❌ [BRANCHES] Error en API:', err);
            // No fallar completamente, continuar sin branches
            return of([]);
          })
        );
      }),

      switchMap((branches) => {
        console.log('📍 [ORGANIZE] Organizando datos finales');

        if (!Array.isArray(branches) || branches.length === 0) {
          console.warn('⚠️ [ORGANIZE] No hay branches, organizando sin ellos');
          this.branchData = [];
        } else {
          this.branchData = branches as Branch[];
          console.log(`✅ [ORGANIZE] ${branches.length} branches disponibles`);
        }

        // Llamar al servicio de organización
        return this.organizeAndSaveProcedures();
      }),

      catchError(error => {
        console.error('❌ [BRANCHES] Error en flujo de branches:', error);
        this.setErrorMessages();
        return of({ complete: false, error: error.message || 'Error en branches' });
      })
    );
  }

  private organizeAndSaveProcedures(): Observable<any> {
    console.log('📊 [ORGANIZE] Creando lista de procedimientos');

    try {
      // Verificar que tenemos los datos necesarios
      if (!this.procedureData || this.procedureData.length === 0) {
        console.error('❌ [ORGANIZE] No hay procedureData');
        this.setErrorMessages();
        return of({ complete: false, error: 'No hay procedureData' });
      }

      if (!this.doctorData || this.doctorData.length === 0) {
        console.error('❌ [ORGANIZE] No hay doctorData');
        this.setErrorMessages();
        return of({ complete: false, error: 'No hay doctorData' });
      }

      console.log(`📊 [ORGANIZE] Datos disponibles:
      - Procedimientos: ${this.procedureData?.length || 0} items
      - Doctores: ${this.doctorData?.length || 0} items
      - Branches: ${this.branchData?.length || 0} items
      - DoctorMap: ${Object.keys(this.doctorProcedureMap || {}).length} keys
      - CompanyMap: ${Object.keys(this.companyMap || {}).length} keys`);

      // Si necesitas ver el contenido completo:
      console.log('📋 Detalles completos:', {
        procedureData: this.procedureData,
        doctorData: this.doctorData,
        branchData: this.branchData,
        doctorProcedureMap: this.doctorProcedureMap,
        companyMap: this.companyMap
      });
      // Ejecutar organización
      const result = this.organiceDataService.createTargetProcedureList(
        this.procedureData,
        this.doctorData,
        this.branchData,
        this.doctorProcedureMap,
        this.companyMap
      );

      // Si el servicio retorna Observable
      if (result && typeof (result as any).subscribe === 'function') {
        console.log('🔄 [ORGANIZE] Servicio retorna Observable');
        return (result as Observable<any>).pipe(
          map(() => {
            console.log('✅ [ORGANIZE] Procedimientos organizados exitosamente');
            return { complete: true };
          }),
          catchError(err => {
            console.error('❌ [ORGANIZE] Error organizando:', err);
            this.setErrorMessages();
            return of({ complete: false, error: err.message });
          })
        );
      }

      // Si el servicio retorna void o un valor directo
      console.log('✅ [ORGANIZE] Procedimientos organizados exitosamente (sync)');
      return of({ complete: true });

    } catch (error: any) {
      console.error('❌ [ORGANIZE] Error en organización:', error);
      this.setErrorMessages();
      return of({ complete: false, error: error.message || 'Error organizando datos' });
    }
  }

  // Métodos helper para manejo de storage
  private clearPreviousData(): void {
    this.procedureData = [];
    this.doctorData = [];
    this.branchData = [];
    this.doctorProcedureMap.clear();
    this.companyMap.clear();
  }

  private setEmptyProceduresMessages(): void {
    this.storageService.setItem('upcomingProcedures', 'No hay procedimientos programados');
    this.storageService.setItem('lastProcedures', 'No hay procedimientos anteriores');
    console.log('ℹ️ [STORAGE] Mensajes de "sin procedimientos" establecidos');
  }

  private setErrorMessages(): void {
    this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
    this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
    console.log('⚠️ [STORAGE] Mensajes de error establecidos');
  }

  private ensureStorageDefaults(): void {
    const upcoming = this.storageService.getItem('upcomingProcedures');
    const last = this.storageService.getItem('lastProcedures');

    if (!upcoming) {
      this.storageService.setItem('upcomingProcedures',
        'Error: no se pudo procesar la información, intenta mas tarde');
      console.warn('⚠️ [STORAGE] upcomingProcedures vacío, estableciendo default');
    }

    if (!last) {
      this.storageService.setItem('lastProcedures',
        'Error: no se pudo procesar la información, intenta mas tarde');
      console.warn('⚠️ [STORAGE] lastProcedures vacío, estableciendo default');
    }

    console.log('✅ [STORAGE] Verificación de storage completada');
  }
}