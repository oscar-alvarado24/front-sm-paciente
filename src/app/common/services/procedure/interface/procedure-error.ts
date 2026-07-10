import { ProcedureErrorType } from "./procedure-error-type";

export interface ProcedureError {
    type: ProcedureErrorType;
    message: string;
    details?: any;
    timestamp: Date;
    action?: string;
}
