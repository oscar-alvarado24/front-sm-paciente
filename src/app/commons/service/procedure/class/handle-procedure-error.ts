import { HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { ProcedureError } from "../interface/procedure-error";
import { ProcedureErrorType } from "../interface/procedure-error-type";

export class HandleProcedureError {
    static handleProcedureError(error: HttpErrorResponse, context: string = ''): Observable<never> {
        let procedureError: ProcedureError;

        // Crear timestamp
        const timestamp = new Date();

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente/red
            procedureError = {
                type: ProcedureErrorType.NETWORK_ERROR,
                message: 'Error de conexión. Verifique su conexión a internet.',
                details: error.error.message,
                timestamp,
                action: 'Intentar nuevamente'
            };
        } else {
            // Error del servidor - mapeo específico por status y contexto
            switch (error.status) {
                case 400:
                    procedureError = this.handleBadRequestError(error, context, timestamp);
                    break;
                case 401:
                    procedureError = {
                        type: ProcedureErrorType.AUTHORIZATION_FAILED,
                        message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
                        details: error.error,
                        timestamp,
                        action: 'Iniciar sesión'
                    };
                    break;
                case 403:
                    procedureError = {
                        type: ProcedureErrorType.AUTHORIZATION_FAILED,
                        message: 'No tiene permisos para realizar esta acción.',
                        details: error.error,
                        timestamp,
                        action: 'Contactar administrador'
                    };
                    break;
                case 404:
                    procedureError = this.handleNotFoundError(error, context, timestamp);
                    break;
                case 409:
                    procedureError = {
                        type: ProcedureErrorType.DUPLICATE_PROCEDURE,
                        message: 'Ya existe un procedimiento similar programado.',
                        details: error.error,
                        timestamp,
                        action: 'Verificar fecha y doctor'
                    };
                    break;
                case 422:
                    procedureError = {
                        type: ProcedureErrorType.VALIDATION_ERROR,
                        message: 'Datos inválidos. Verifique la información ingresada.',
                        details: error.error?.errors || error.error,
                        timestamp,
                        action: 'Corregir datos'
                    };
                    break;
                case 500:
                case 502:
                case 503:
                    procedureError = {
                        type: ProcedureErrorType.SERVER_ERROR,
                        message: 'Error interno del servidor. Intente más tarde.',
                        details: error.error,
                        timestamp,
                        action: 'Intentar más tarde'
                    };
                    break;
                default:
                    procedureError = {
                        type: ProcedureErrorType.UNKNOWN_ERROR,
                        message: `Error inesperado (${error.status}): ${error.error?.message || 'Error desconocido'}`,
                        details: error.error,
                        timestamp,
                        action: 'Contactar soporte'
                    };
            }
        }

        // Retornar observable de error
        return throwError(() => procedureError);
    }

    static handleBadRequestError(error: HttpErrorResponse, context: string, timestamp: Date): ProcedureError {
        const errorMessage = error.error?.message || '';

        // Mapeo específico basado en el mensaje del servidor
        if (errorMessage.includes('doctor') && errorMessage.includes('available')) {
            return {
                type: ProcedureErrorType.DOCTOR_NOT_AVAILABLE,
                message: 'El doctor no está disponible en la fecha y hora seleccionada.',
                details: error.error,
                timestamp,
                action: 'Seleccionar otra fecha'
            };
        }

        if (errorMessage.includes('date') || errorMessage.includes('fecha')) {
            return {
                type: ProcedureErrorType.INVALID_DATE,
                message: 'La fecha seleccionada no es válida.',
                details: error.error,
                timestamp,
                action: 'Seleccionar fecha válida'
            };
        }


        return {
            type: ProcedureErrorType.VALIDATION_ERROR,
            message: 'Error de validación: ' + errorMessage,
            details: error.error,
            timestamp,
            action: 'Verificar datos'
        };
    }

    static handleNotFoundError(error: HttpErrorResponse, context: string, timestamp: Date): ProcedureError {
        if (context.includes('patient')) {
            return {
                type: ProcedureErrorType.PATIENT_NOT_FOUND,
                message: 'El paciente especificado no fue encontrado.',
                details: error.error,
                timestamp,
                action: 'Verificar ID del paciente'
            };
        }

        return {
            type: ProcedureErrorType.PROCEDURE_NOT_FOUND,
            message: 'El procedimiento solicitado no fue encontrado.',
            details: error.error,
            timestamp,
            action: 'Verificar ID del procedimiento'
        };
    }
}
