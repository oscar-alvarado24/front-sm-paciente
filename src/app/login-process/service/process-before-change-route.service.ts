import { Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { GetAndProcessProcedureService } from './getAndprocessProcedureData/get-and-process-procedure.service';
import { GetAndSaveSessionService } from './get-and-save-session/get-and-save-session.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessBeforeChangeRouteService {

  constructor(
    private readonly procedureService: GetAndProcessProcedureService,
    private readonly getAndaveSessionService: GetAndSaveSessionService
  ) { }

  executeProcess() {
    return forkJoin({
      procedureFlow: this.procedureService.startFlowForGetProcedures().pipe(
        map((procedure: { complete: any; }) => {
          if (procedure) {
            if (procedure.complete) {
              return { success: true }
            } else {
              return { success: false, error: 'startFlowForGetProcedures response with a false' }
            }
          } else {
            return { success: false, error: 'startFlowForGetProcedures response with a null' }
          }
        }
        )
      ),
      sessionFlow: this.getAndaveSessionService.startFlowForSession().pipe(
        map((session: { complete: any; }) => {
          if (session) {
            if (session.complete) {
              return { success: true }
            } else {
              return { success: false, error: 'startFlowForSession response with a false' }
            }
          } else {
            return { success: false, error: 'startFlowForSession response with a null' }
          }
        }
        )
      )
    })
  }
}

