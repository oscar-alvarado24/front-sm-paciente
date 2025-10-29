import { Injectable } from '@angular/core';
import { ProcedureService } from '../../../commons/service/procedure/service/procedure.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';
import { Doctor } from '../../../commons/service/employee/interface/employee';
import { Branch } from '../../../commons/service/provider/interface/provider';
import { forkJoin, from, Observable, of } from 'rxjs';
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
    console.log('start flow of get procedures');
    return this.procedureService.getProceduresByPatientId(this.storageService.getItem("patient"))
      .pipe(
        switchMap((procedures: MedicalProcedure[]) => {
          this.procedureData = procedures;
          console.log('procedureAPI consumed');
          if (procedures.length === 0) {
            console.log('No procedures found');
            this.storageService.setItem('upcomingProcedures', 'No hay procedimientos programados');
            this.storageService.setItem('lastProcedures', 'No hay procedimientos anteriores');
            return of(null);
          }
          return this.consultDoctorsAndBranchesData(procedures);
        }),
        finalize(() => {
        const upcoming = this.storageService.getItem('upcomingProcedures');
        const last = this.storageService.getItem('lastProcedures');
        
        if (!upcoming) {
          this.storageService.setItem('upcomingProcedures', 
            'Error: no se pudo procesar la información, intenta mas tarde');
        }
        if (!last) {
          this.storageService.setItem('lastProcedures', 
            'Error: no se pudo procesar la información, intenta mas tarde');
        }
      }),
        catchError(error => {
          console.error('Error getting procedures:', error);
          this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          return of({ complete: false, error: error.message });
        })
      );
  }

  private consultDoctorsAndBranchesData(procedures: MedicalProcedure[]): Observable<any> {
    console.log('start flow of get doctors');

    // Obtener doctorIds encriptados únicos
    const encryptedDoctorIds: string[] = [...new Set(procedures.map(p => p.doctorId))];
    console.log('🔵 IDs encriptados únicos:', encryptedDoctorIds);

    // Desencriptar todos los IDs en paralelo
    const decryptObservables = encryptedDoctorIds.map(encryptedId =>
      from(this.cryptoService.decryptAsync(encryptedId)).pipe(
        map(decrypted =>{
          if(decrypted){
            this.doctorProcedureMap.set(encryptedId, decrypted);
          }
          return decrypted;
        }),
        map(decrypted => {
          const num = Number(decrypted);
          console.log(`Desencriptado: ${encryptedId.substring(0, 10)}... -> ${num}`);
          return num;
        }),
        catchError(err => {
          console.error('❌ Error desencriptando ID:', encryptedId, err);
          return of(null);
        })
      )
    );

    // Esperar a que todos se desencripten
    return forkJoin(decryptObservables).pipe(
      map(ids => {
        const filteredIds = ids.filter(id => id !== null && !isNaN(id)) as number[];
        return new Set(filteredIds);
      }),
      tap(doctorIds => console.log('🟢 IDs desencriptados:', doctorIds)),
      switchMap(doctorIds => {
        if (doctorIds.size === 0) {
          console.warn('⚠️ No se pudieron desencriptar doctorIds');
          this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          return of(null);
        }

        return this.employeeService.getDoctorByIds([...doctorIds]);
      }),
      switchMap((doctors) => {
        if (!doctors || doctors.length === 0) {
          this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          return of(null);
        }

        this.doctorData = doctors;

        return this.getBranchesData(doctors);
      }),
      catchError(error => {
        console.error('❌ Error en consultDoctorsAndBranchesData:', error);
        this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
        this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
        return of(null);
      })
    );
  }

  private getBranchesData(doctors: Doctor[]): Observable<any> {
    // 1. Obtener companies encriptados únicos
    const encryptedCompanies: string[] = doctors.map(d => d.company);
    console.log('🔵 Companies encriptados únicos:', encryptedCompanies);

    // 2. Desencriptar todos los companies en paralelo
    const decryptObservables = encryptedCompanies.map(encrypted =>
      from(this.cryptoService.decryptAsync(encrypted)).pipe(
        map(decrypted => ({
          encrypted,
          decrypted: decrypted.toString()
        })),
        catchError(err => {
          console.error('❌ Error desencriptando company:', encrypted, err);
          return of(null);
        })
      )
    );

    // 3. Crear mapa de encriptado -> desencriptado y continuar
    return forkJoin(decryptObservables).pipe(
      map(results => {
        results.forEach(result => {
          if (result) {
            this.companyMap.set(result.encrypted, result.decrypted);
          }
        });
        return this.companyMap;
      }),
      map(decryptionMap => {
        // Generar llaves únicas directamente
        const keySet = new Set<string>();

        doctors.forEach(doc => {
          const decryptedCompany = decryptionMap.get(doc.company);
          if (decryptedCompany) {
            keySet.add(`${decryptedCompany} | ${doc.workplace}`);
          }
        });

        return Array.from(keySet);
      }),
      tap(keys => console.log('🟢 Keys creados:', keys)),
      switchMap(keys => {
        if (keys.length === 0) {
          console.warn('⚠️ No se pudieron crear keys');
          this.storageService.setItem('upcomingProcedures', 'Error...');
          this.storageService.setItem('lastProcedures', 'Error...');
          return of(null);
        }

        console.log('start flow of get branches');
        return this.providerService.getBranchesByIds(keys);
      }),
      switchMap((branches) => {
        console.log('point where the branches were already obtained');
        if (!branches || branches.length === 0) {
          return of(undefined);
        }
        this.branchData = branches;
        return this.organiceDataService.createTargetProcedureList(
          this.procedureData,
          this.doctorData,
          this.branchData,
          this.doctorProcedureMap,
          this.companyMap
        );
      }),
      catchError(error => {
        console.error('❌ Error en getBranchesData:', error);
        this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
        this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
        return of(null);
      })
    );
  }
}
