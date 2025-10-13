import { TargetProcedure } from "../../../interface/target-procedure";
import { Doctor } from "../../../../commons/service/employee/interface/employee";
import { StorageService } from "../../../../commons/service/localStotarage/local-storage.service";
import { MedicalProcedure } from "../../../../commons/service/procedure/interface/medical-procedure";
import { Branch } from "../../../../commons/service/provider/interface/provider";

export class ProcessProcedures {


    static classifyAppointments(procedures: TargetProcedure[], storageService: StorageService): void {
        console.log("Classifying procedures:", procedures);
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
        storageService.setItem('upcomingProcedures', upcomingList);
        storageService.setItem('lastProcedures', previousList);
    }

    static createTargetProcedureList(procedures: MedicalProcedure[], doctors: Doctor[], branches: Branch[]): TargetProcedure[] {
        const doctorsMap = new Map(doctors.map(doc => [doc.id, doc]));
        const branchesMap = new Map(branches.map(branch => [branch.branch_id, branch]));

        const targets: TargetProcedure[] = [];

        for (const procedure of procedures) {
            const doctor = doctorsMap.get(procedure.doctorId);
            const branch = branchesMap.get(doctor!.workplace);
            console.log('Branch found:', branch);

            const targetProcedure: TargetProcedure = {
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
            targets.push(targetProcedure);
        }
        return targets;
    }
}
