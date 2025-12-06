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
    console.log('📊 [CLASSIFY] Iniciando clasificación de procedimientos');
    console.log('📊 [CLASSIFY] Total a clasificar:', procedures.length);

    const now = new Date();
    const upcomingList: TargetProcedure[] = [];
    const previousList: TargetProcedure[] = [];

    // Filtrar y separar citas
    procedures.forEach((procedure, index) => {
      try {
        // Validar que tenga los campos requeridos
        if (!procedure.date) {
          console.warn(`⚠️ [CLASSIFY] Procedimiento ${index + 1} sin fecha, ignorado:`, procedure);
          return;
        }

        const procedureDate = new Date(procedure.date);

        // Validar que la fecha sea válida
        if (isNaN(procedureDate.getTime())) {
          console.warn(`⚠️ [CLASSIFY] Fecha inválida en procedimiento ${index + 1}:`, procedure);
          return;
        }

        // Clasificar según si es futura o pasada (o REQUIRED)
        if (procedure.status === 'REQUIRED' || procedureDate >= now) {
          upcomingList.push(procedure);
          console.log(`➡️ [CLASSIFY] Procedimiento ${index + 1} → UPCOMING`);
        } else {
          previousList.push(procedure);
          console.log(`⬅️ [CLASSIFY] Procedimiento ${index + 1} → PREVIOUS`);
        }

      } catch (error) {
        console.error(`❌ [CLASSIFY] Error procesando procedimiento ${index + 1}:`, error, procedure);
      }
    });

    // Ordenar próximas citas (más cercana primero)
    upcomingList.sort((a, b) => {
      // REQUIRED siempre al inicio
      if (a.status === 'REQUIRED' && b.status !== 'REQUIRED') return -1;
      if (a.status !== 'REQUIRED' && b.status === 'REQUIRED') return 1;

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

    console.log(`✅ [CLASSIFY] Clasificación completada:
      - Próximos: ${upcomingList.length}
      - Anteriores: ${previousList.length}`);

    // ⚠️ CRÍTICO: Convertir a JSON antes de guardar
    const upcomingJSON = JSON.stringify(upcomingList);
    const previousJSON = JSON.stringify(previousList);

    console.log('💾 [CLASSIFY] Guardando en localStorage:');
    console.log(`   - upcomingProcedures: ${upcomingJSON.length} caracteres`);
    console.log(`   - lastProcedures: ${previousJSON.length} caracteres`);

    // Guardar como strings JSON
    this.storageService.setItem('upcomingProcedures', upcomingJSON);
    this.storageService.setItem('lastProcedures', previousJSON);

    // Verificar que se guardó correctamente
    const savedUpcoming = this.storageService.getItem('upcomingProcedures');
    const savedPrevious = this.storageService.getItem('lastProcedures');

    console.log('🔍 [CLASSIFY] Verificando guardado:');
    console.log(`   - upcomingProcedures guardado: ${savedUpcoming ? 'SÍ' : 'NO'} (${savedUpcoming?.length || 0} chars)`);
    console.log(`   - lastProcedures guardado: ${savedPrevious ? 'SÍ' : 'NO'} (${savedPrevious?.length || 0} chars)`);

    if (savedUpcoming) {
      console.log('   - Preview upcoming:', savedUpcoming.substring(0, 100) + '...');
    }
    if (savedPrevious) {
      console.log('   - Preview previous:', savedPrevious.substring(0, 100) + '...');
    }

    console.log('✅ [CLASSIFY] Procedimientos clasificados y guardados exitosamente');

    return of({ complete: true });
  }

  createTargetProcedureList(
    procedures: MedicalProcedure[],
    doctors: Doctor[],
    branches: Branch[],
    doctorIdFromProcedureMap: Map<string, string>,
    companyMap: Map<string, string>
  ): Observable<any> {
    console.log('🎯 [CREATE-TARGET] Iniciando creación de target procedures');
    console.log('🎯 [CREATE-TARGET] Input:', {
      procedures: procedures.length,
      doctors: doctors.length,
      branches: branches.length,
      doctorMap: doctorIdFromProcedureMap.size,
      companyMap: companyMap.size
    });

    return forkJoin({
      proceduresFlow: this.decryptAndOrganiceProcedures(procedures, doctorIdFromProcedureMap),
      doctorsFlow: this.decryptAndOrganiceDoctors(doctors, companyMap)
    }).pipe(
      switchMap(result => {
        console.log('🔄 [CREATE-TARGET] forkJoin completado:', {
          procedures: result.proceduresFlow.length,
          doctors: result.doctorsFlow.length
        });

        const doctorsData: Doctor[] = result.doctorsFlow;
        const doctorsMap = new Map(doctorsData.map(doc => [doc.id, doc]));
        const branchesMap = new Map(branches.map(branch => [branch.branch_id, branch]));

        console.log('📋 [CREATE-TARGET] Maps creados:', {
          doctorsMap: doctorsMap.size,
          branchesMap: branchesMap.size
        });

        // Crear targets
        const targets: TargetProcedure[] = result.proceduresFlow.map((procedure, index) => {
          const doctor = doctorsMap.get(procedure.doctorId);

          if (!doctor) {
            console.warn(`⚠️ [CREATE-TARGET] Doctor no encontrado para procedimiento ${index + 1}, ID: ${procedure.doctorId}`);
          }

          const branch = doctor ? branchesMap.get(doctor.workplace) : undefined;

          if (doctor && !branch) {
            console.warn(`⚠️ [CREATE-TARGET] Branch no encontrado para doctor ${doctor.name}, workplace: ${doctor.workplace}`);
          }

          const target: TargetProcedure = {
            name: procedure.name || 'Sin nombre',
            doctorName: doctor?.name || 'Doctor no encontrado',
            specialty: doctor?.specialty || 'Sin especialidad',
            medicalCenterName: branch?.branch_name || doctor?.workplace || 'Centro no encontrado',
            city: branch?.city || 'Sin ciudad',
            address: branch?.address || 'Sin dirección',
            date: procedure.date || new Date().toISOString(),
            observations: procedure.observations || '',
            status: procedure.status || 'UNKNOWN'
          };

          console.log(`✅ [CREATE-TARGET] Target ${index + 1}/${result.proceduresFlow.length} creado:`, {
            name: target.name,
            doctor: target.doctorName,
            status: target.status
          });

          return target;
        });

        console.log(`✅ [CREATE-TARGET] ${targets.length} targets creados, clasificando...`);
        return this.classifyAppointments(targets);
      }),
      catchError(error => {
        console.error('❌ [CREATE-TARGET] Error en createTargetProcedureList:', error);
        return of({ complete: false, error: error.message });
      })
    );
  }

  private decryptAndOrganiceProcedures(
    procedures: MedicalProcedure[],
    doctorIdFromProcedureMap: Map<string, string>
  ): Observable<MedicalProcedure[]> {
    console.log('🔓 [DECRYPT-PROC] Desencriptando procedimientos');

    const proceduresData = procedures.map((procedure, index) => {
      const decryptedDoctorId = doctorIdFromProcedureMap.get(procedure.doctorId);

      if (!decryptedDoctorId) {
        console.warn(`⚠️ [DECRYPT-PROC] No se encontró doctorId desencriptado para procedimiento ${index + 1}`);
      }

      return {
        ...procedure,
        doctorId: decryptedDoctorId || procedure.doctorId
      };
    });

    console.log(`✅ [DECRYPT-PROC] ${proceduresData.length} procedimientos procesados`);
    return of(proceduresData);
  }

  private decryptAndOrganiceDoctors(
    doctors: Doctor[],
    companyMap: Map<string, string>
  ): Observable<Doctor[]> {
    console.log('🔓 [DECRYPT-DOC] Desencriptando IDs de doctores');
    console.log(`🔓 [DECRYPT-DOC] Total a desencriptar: ${doctors.length}`);

    const encryptedIds: string[] = doctors.map(d => d.id);

    // Desencriptar todos los IDs en paralelo
    const decryptObservables = encryptedIds.map((encrypted, index) =>
      from(this.cryptoService.decryptAsync(encrypted)).pipe(
        map(decrypted => {
          console.log(`✅ [DECRYPT-DOC] [${index + 1}/${encryptedIds.length}] ID desencriptado`);
          return {
            encrypted,
            decrypted: decrypted.toString()
          };
        }),
        catchError(err => {
          console.error(`❌ [DECRYPT-DOC] Error desencriptando ID [${index + 1}]:`, err);
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
        console.log(`✅ [DECRYPT-DOC] ${decriptedMap.size} IDs desencriptados exitosamente`);
        return decriptedMap;
      }),
      map(decriptedMap => {
        return doctors.map((d, index) => {
          const decryptedDoctorId = decriptedMap.get(d.id);
          const decryptedCompanyId = companyMap.get(d.company);

          if (!decryptedDoctorId) {
            console.warn(`⚠️ [DECRYPT-DOC] Doctor ${index + 1}: ID no desencriptado`);
          }
          if (!decryptedCompanyId) {
            console.warn(`⚠️ [DECRYPT-DOC] Doctor ${index + 1}: Company no desencriptado`);
          }

          return {
            ...d,
            id: decryptedDoctorId || d.id,
            company: decryptedCompanyId || d.company
          };
        });
      })
    );
  }
}