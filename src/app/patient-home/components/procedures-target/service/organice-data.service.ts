import { Injectable } from '@angular/core';
import { catchError, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { CryptoService } from '../../../../commons/service/crypto/crypto.service';
import { Doctor } from '../../../../commons/service/employee/interface/employee';
import { StorageService } from '../../../../commons/service/localStotarage/local-storage.service';
import { MedicalProcedure } from '../../../../commons/service/procedure/interface/medical-procedure';
import { Branch } from '../../../../commons/service/provider/interface/provider';
import { TargetProcedure } from '../../../interface/target-procedure';

@Injectable({
  providedIn: 'root'
})
export class OrganiceDataService {

  constructor(
    private readonly storageService: StorageService,
    private readonly cryptoService: CryptoService
  ) { }

  classifyAppointments(procedures: TargetProcedure[]): Observable<any> {
    console.log('start flow of classify appointments');
    console.log('Procedures to classify:', procedures);
    const now = new Date();
    const upcomingList: TargetProcedure[] = [];
    const previousList: TargetProcedure[] = [];

    // Filtrar y separar citas
    procedures.forEach(procedure => {
      try {
        // Validar que tenga los campos requeridos
        if (!procedure.date) {
          console.warn('Cita con datos incompletos ignorada:', procedure);
          return;
        }

        const procedureDate = new Date(procedure.date);

        // Validar que la fecha sea válida
        if (isNaN(procedureDate.getTime())) {
          console.warn('Fecha inválida en cita:', procedure);
          return;
        }

        // Clasificar según si es futura o pasada
        if (procedureDate >= now) {
          upcomingList.push(procedure);
        } else {
          previousList.push(procedure);
        }

      } catch (error) {
        console.error('Error procesando cita:', procedure, error);
      }
    });

    // Ordenar próximas citas (más cercana primero)
    upcomingList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Ordenar citas anteriores (más reciente primero)
    previousList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    console.log('Próximas citas clasificadas:', upcomingList);
    console.log('Citas anteriores clasificadas:', previousList);
    // Guardar en almacenamiento local
    this.storageService.setItem('upcomingProcedures', upcomingList);
    this.storageService.setItem('lastProcedures', previousList);
    console.log('Procedures processed successfully');
    return of({ complete: true })
  }

  createTargetProcedureList(
    procedures: MedicalProcedure[],
    doctors: Doctor[],
    branches: Branch[],
    doctorIdFromProcedureMap: Map<string, string>,
    companyMap: Map<string, string>
  ): Observable<any> {
    console.log('start flow of create target procedure list')
    return forkJoin({
      proceduresFlow: this.decryptAndOrganiceProcedures(procedures, doctorIdFromProcedureMap),
      doctorsFlow: this.decryptAndOrganiceDoctors(doctors, companyMap)
    }).pipe(
      switchMap(result => {
        console.log('result', result)
        const doctorsData: Doctor[] = result.doctorsFlow;
        const doctorsMap = new Map(doctorsData.map(doc => [doc.id, doc]));
        const branchesMap = new Map(branches.map(branch => [branch.branch_id, branch]));

        // ✅ Usar map directamente en lugar de for + push
        const targets: TargetProcedure[] = result.proceduresFlow.map(procedure => {
          const doctor = doctorsMap.get(procedure.doctorId);
          const branch = branchesMap.get(doctor!.workplace);

          return {
            name: procedure.name,
            doctorName: doctor?.name || '',
            specialty: doctor?.specialty || '',
            medicalCenterName: branch?.branch_name || '',
            city: branch?.city || '',
            address: branch?.address || '',
            date: procedure.date,
            observations: procedure.observations || '',
            status: procedure.status
          };
        });
        console.log('targets', targets)
        return this.classifyAppointments(targets);
      }),
      //switchMap(targets => )
    );
  }
  private decryptAndOrganiceProcedures(procedures: MedicalProcedure[], doctorIdFromProcedureMap: Map<string, string>): Observable<MedicalProcedure[]> {
    console.log('start flow of decrypt and organice procedures')
    const proceduresData = procedures.map(procedure => {
      const decryptedDoctorId = doctorIdFromProcedureMap.get(procedure.doctorId)!;
      return {
        ...procedure,
        doctorId: decryptedDoctorId
      };
    })
    return of(proceduresData);
  }

  private decryptAndOrganiceDoctors(doctors: Doctor[], companyMap: Map<string, string>): Observable<Doctor[]> {
    console.log('start flow of decrypt and organice doctors')
    const encryptedIds: string[] = doctors.map(d => d.id);

    // 2. Desencriptar todos los companies en paralelo
    const decryptObservables = encryptedIds.map(encrypted =>
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
    return forkJoin(decryptObservables).pipe(
      map(results => {
        const decriptedMap = new Map<string, string>();
        results.forEach(result => {
          if (result) {
            decriptedMap.set(result.encrypted, result.decrypted);
          }
        });
        return decriptedMap;
      }),
      map(decriptedMap => {
        return doctors.map(d => {
          const decryptedDoctorId = decriptedMap.get(d.id)!;
          const decryptedCompanyId = companyMap.get(d.company)!;
          return {
            ...d,
            id: decryptedDoctorId,
            company: decryptedCompanyId
          };
        })
      })
    )
  }
}
