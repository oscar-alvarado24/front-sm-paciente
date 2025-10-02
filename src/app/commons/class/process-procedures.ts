import { StorageService } from "../service/localStotarage/local-storage.service";

export class ProcessProcedures {
    

    static classifyAppointments(procedures: any[], storageService: StorageService): void {
        console.log("Classifying procedures:", procedures);
        const now = new Date();
        const upcomingList: any[] = [];
        const previousList: any[] = [];

        // Filtrar y separar citas
        procedures.forEach(procedure => {
            try {
                // Validar que tenga los campos requeridos
                if (!procedure.date ) {
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

        // Guardar en almacenamiento local
        storageService.setItem('upcomingProcedures', upcomingList);
        storageService.setItem('lastProcedures', previousList);
    }
}
