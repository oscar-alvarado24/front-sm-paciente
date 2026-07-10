import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { GetAndProcessProcedureService } from '../get-and-process-procedure/get-and-process-procedure-service';
import { GetAndSaveSessionService } from '../get-and-save-session/get-and-save-session-service';

interface ProcessResult {
  success: boolean;
  error?: string;
}

interface ExecuteProcessResult {
  procedureFlow: ProcessResult;
  sessionFlow: ProcessResult;
}

@Injectable({ providedIn: 'root' })
export class ProcessBeforeChangeRouteService {
  private readonly processProcedureService = inject(GetAndProcessProcedureService);
  private readonly getAndSaveSessionService = inject(GetAndSaveSessionService);

  executeProcess(): Observable<ExecuteProcessResult> {
    return forkJoin({
      procedureFlow: this.processProcedureService.startFlowForGetProcedures().pipe(
        map(({ complete }): ProcessResult =>
          complete
            ? { success: true }
            : { success: false, error: 'startFlowForGetProcedures respondió con false' }
        )
      ),
      sessionFlow: this.getAndSaveSessionService.startFlowForSession().pipe(
        map(({ complete }): ProcessResult =>
          complete
            ? { success: true }
            : { success: false, error: 'startFlowForSession respondió con false' }
        )
      ),
    });
  }
}