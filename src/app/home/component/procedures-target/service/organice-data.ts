import { inject, Injectable } from '@angular/core';
import { Observable, of, forkJoin, switchMap, catchError, from, map } from 'rxjs';
import { CryptoService } from '../../../../common/services/crypto/crypto';
import { Doctor } from '../../../../common/services/employee/interface/employees';
import { MedicalProcedure } from '../../../../common/services/procedure/interface/medical-procedure';
import { Branch } from '../../../../common/services/provider/interface/branch';
import { TargetProcedure } from '../../../model/target-procedure';
import { LocalStorageService } from '../../../../common/services/local-storage/local-storage';

@Injectable({
  providedIn: 'root',
})
export class OrganiceDataService {
  private readonly storageService = inject(LocalStorageService);
  private readonly cryptoService = inject(CryptoService);

  // ─── Clasificar citas en próximas / anteriores ──────────────────────────────
  classifyAppointments(procedures: TargetProcedure[]): Observable<{ complete: boolean }> {
    const now = new Date();
    const upcomingList: TargetProcedure[] = [];
    const previousList: TargetProcedure[] = [];

    console.debug('📋 Procedimientos a clasificar:', procedures);
    for (const [index, procedure] of procedures.entries()) {
      try {
        console.debug(`Procesando procedimiento ${index + 1}:`, procedure);
        if (!procedure.date) continue;

        const procedureDate = new Date(procedure.date);
        if (Number.isNaN(procedureDate.getTime())) continue;

        if (procedure.status === 'REQUIRED' || procedureDate >= now) {
          upcomingList.push(procedure);
        } else {
          previousList.push(procedure);
        }
      } catch (error) {
        console.error(`Error procesando procedimiento ${index + 1}:`, error);
      }
    }

    // Próximas: REQUIRED primero, luego por fecha ascendente
    upcomingList.sort((a, b) => {
      if (a.status === 'REQUIRED' && b.status !== 'REQUIRED') return -1;
      if (a.status !== 'REQUIRED' && b.status === 'REQUIRED') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Anteriores: más reciente primero
    previousList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.debug('✅ Procedimientos clasificados:', { upcomingList, previousList });

    this.storageService.setItem('upcomingProcedures', upcomingList);
    this.storageService.setItem('lastProcedures', previousList);

    return of({ complete: true });
  }

  // ─── Construir la lista de TargetProcedure ───────────────────────────────────
  createTargetProcedureList(
    procedures: MedicalProcedure[],
    doctors: Doctor[],
    branches: Branch[],
    doctorIdFromProcedureMap: Map<string, string>,
    companyMap: Map<string, string>,
  ): Observable<{ complete: boolean; error?: string }> {
    console.debug('🔄 Iniciando creación de lista de TargetProcedure con procedimientos: ', procedures);
    return forkJoin({
      proceduresFlow: this.decryptAndOrganiceProcedures(procedures, doctorIdFromProcedureMap),
      doctorsFlow: this.decryptAndOrganiceDoctors(doctors, companyMap),
    }).pipe(
      switchMap(({ proceduresFlow, doctorsFlow }) => {
        const doctorsMap = new Map(doctorsFlow.map((doc) => [doc.id, doc]));
        const branchesMap = new Map(branches.map((branch) => [branch.branch_id, branch]));

        console.debug('🔄 Mapeo de doctores y sucursales creado:', { doctorsMap, branchesMap });

        const targets: TargetProcedure[] = proceduresFlow.map((procedure) => {
          const doctor = doctorsMap.get(procedure.doctorId);
          const branch = doctor ? branchesMap.get(doctor.workplace) : undefined;

          console.debug('🔄 Procesando procedimiento para TargetProcedure:', { procedure, doctor, branch });

          return {
            name: procedure.name || 'Sin nombre',
            doctorName: doctor?.name || 'Doctor no encontrado',
            specialty: doctor?.specialty || 'Sin especialidad',
            medicalCenterName: branch?.branch_name ?? doctor?.workplace ?? 'Centro no encontrado',
            city: branch?.city || 'Sin ciudad',
            address: branch?.address || 'Sin dirección',
            date: procedure.date || new Date().toISOString(),
            observations: procedure.observations || '',
            status: procedure.status || 'UNKNOWN',
          };
        });
        console.debug('✅ Lista de TargetProcedure creada:', targets);
        return this.classifyAppointments(targets);
      }),
      catchError((error) => of({ complete: false, error: (error as Error).message })),
    );
  }

  // ─── Desencriptar IDs de doctores en los procedimientos ──────────────────────
  private decryptAndOrganiceProcedures(
    procedures: MedicalProcedure[],
    doctorIdFromProcedureMap: Map<string, string>,
  ): Observable<MedicalProcedure[]> {
    const result = procedures.map((procedure) => ({
      ...procedure,
      doctorId: doctorIdFromProcedureMap.get(procedure.doctorId) ?? procedure.doctorId,
    }));
    console.debug('🔄 Procedimientos con IDs de doctores desencriptados:', result);
    return of(result);
  }

  // ─── Desencriptar IDs y compañías de doctores ────────────────────────────────
  private decryptAndOrganiceDoctors(
    doctors: Doctor[],
    companyMap: Map<string, string>,
  ): Observable<Doctor[]> {
    const decryptObservables = doctors.map((doctor) =>
      from(this.cryptoService.decryptAsync(doctor.id)).pipe(
        map((decrypted) => ({ encrypted: doctor.id, decrypted: decrypted.toString() })),
        catchError(() => of(null)),
      ),
    );

    return forkJoin(decryptObservables).pipe(
      map((results) => {
        const decryptedMap = new Map<string, string>(
          results
            .filter((r): r is { encrypted: string; decrypted: string } => r !== null)
            .map((r) => [r.encrypted, r.decrypted]),
        );

        return doctors.map((doctor) => ({
          ...doctor,
          id: decryptedMap.get(doctor.id) ?? doctor.id,
          company: companyMap.get(doctor.company) ?? doctor.company,
        }));
      }),
    );
  }
}
