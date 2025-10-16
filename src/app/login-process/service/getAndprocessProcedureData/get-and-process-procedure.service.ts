import { Injectable } from '@angular/core';
import { ProcedureService } from '../../../commons/service/procedure/service/procedure.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';
import { Doctor } from '../../../commons/service/employee/interface/employee';
import { Branch } from '../../../commons/service/provider/interface/provider';
import { Observable, of } from 'rxjs';
import { ProcessProcedures } from '../../../patient-home/components/procedures-target/class/process-procedures';
import { BranchRequest } from '../../../commons/service/provider/interface/branch-request';
import { EmployeeService } from '../../../commons/service/employee/service/employee.service';
import { ProviderService } from '../../../commons/service/provider/service/provider.service';
import { Encrypt } from '../../../commons/class/encrypt';

@Injectable({
  providedIn: 'root'
})
export class GetAndProcessProcedureService {



  procedureData: MedicalProcedure[] = [];
  doctorData: Doctor[] = [];
  branchData: Branch[] = [];

  constructor(
    private readonly procedureService: ProcedureService,
    private readonly storageService: StorageService,
    private readonly employeeService: EmployeeService,
    private readonly providerService: ProviderService
  ) {
    this.procedureService = procedureService;
    this.storageService = storageService;
    this.employeeService = employeeService;
    this.providerService = providerService;
  }

  startFlowForGetProcedures(): Observable<any> {
    console.log('start flow of get procedures');
    return this.procedureService.getProceduresByPatientId(parseInt(Encrypt.decryptParam(this.storageService.getItem("patient"))), "PRINCIPAL_PAGE", 3)
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
          return this.consultDoctorsAndBranchesData(procedures).pipe(
            catchError(error => {
              console.error('Error in procedures flow:', error);
              // Aún con error, el flujo se ejecutó
              return of(null);
            }),
          );
        }),
        catchError(error => {
          console.error('Error getting procedures:', error);
          this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          return of(null);;

        })
      );
  }

  private consultDoctorsAndBranchesData(procedures: any): Observable<any> {
    console.log('start flow of get doctors');
    const doctorIds: number[] = [...new Set((procedures as Array<{ doctorId: number }>).map(p => Number(p.doctorId)))];
    return this.employeeService.getDoctorByIds(doctorIds).pipe(
      switchMap((doctors) => {
        this.doctorData = doctors;

        if (doctors.length === 0) {
          this.storageService.setItem('upcomingProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          this.storageService.setItem('lastProcedures', 'Error al consultar los procedimientos, intenta mas tarde');
          return of(null);
        }

        return this.getBranchesData(doctors).pipe(
          map((response) => console.log('response', response))
        );
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
    const branchRequests: BranchRequest[] = Array.from(
      doctors.reduce((map, doc: Doctor) => {
        const key = `${doc.company}|${doc.workplace}`;
        if (!map.has(key)) {
          map.set(key, { company_id: doc.company.toString(), branch_id: doc.workplace });
        }
        return map;
      }, new Map<string, BranchRequest>()).values()
    );
    console.log('start flow of get branches');
    return this.providerService.getBranchesByIds(branchRequests).pipe(
      map((branches) => {
        console.log('point where the branches were already obtained ');
        this.branchData = branches;
        if (branches.length === 0) {
          return of(undefined);
        }
        return ProcessProcedures.createTargetProcedureList(
          this.procedureData,
          this.doctorData,
          this.branchData,
          this.storageService
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
