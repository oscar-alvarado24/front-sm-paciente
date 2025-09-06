export enum GlobalErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR', 
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class GlobalError extends Error {
  constructor(
    public type: GlobalErrorType,
    public originalMessage: string,
    public code?: string,
    public classification?: string
  ) {
    super(originalMessage);
    this.name = 'GlobalError';
  }
}