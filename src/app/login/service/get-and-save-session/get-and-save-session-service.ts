import { inject, Injectable } from '@angular/core';
import { catchError, map, retry, switchMap, timeout, tap } from 'rxjs/operators';
import { forkJoin, from, Observable, of } from 'rxjs';
import { CryptoService } from '../../../common/services/crypto/crypto';
import { PatientNtService } from '../../../common/services/patient/patient-nt';
import { SqsService } from '../../../common/services/sqs/sqs';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { GetIpService } from '../get-ip/get-ip-service';
import { GetIpDataService } from '../get-ip-data/get-ip-data-service';
import { SessionService } from '../session/session-service';
import { Ip } from '../get-ip/model/ip';
import { IpData } from '../get-ip-data/model/ip-data';
import { environment } from '../../../../environments/environment';

interface FlowResult {
  complete: boolean;
  error?: string;
  source?: string;
}

interface PatientData {
  email: string;
  name: string;
  cellphone: string;
}

interface LoginMessage {
  message_type: string;
  channels: string;
  patient_email: string;
  cellphone: string;
  patient_name: string;
  date_hour: string;
  ip: string;
  geographic_location: string;
  ses_verified: boolean;
}

@Injectable({ providedIn: 'root' })
export class GetAndSaveSessionService {
  private readonly sessionService = inject(SessionService);
  private readonly storageService = inject(LocalStorageService);
  private readonly getIpService = inject(GetIpService);
  private readonly getIpDataService = inject(GetIpDataService);
  private readonly cryptoService = inject(CryptoService);
  private readonly patientService = inject(PatientNtService);
  private readonly sqsService = inject(SqsService);

  private emailEncrypted = '';

  startFlowForSession(): Observable<FlowResult> {
    console.log('🔐 Iniciando startFlowForSession');
    const email = this.storageService.getItem<string>('email') || '';
    if (!email || email.trim() === '') {
      console.warn('✉️  No se encontró email en localStorage');
      return of({ complete: false, error: 'Email no encontrado' });
    }
    return from(
      this.cryptoService.encryptAsync(email, 'backend'),
    ).pipe(
      tap((encrypted) => {
        this.emailEncrypted = encrypted;
        console.log('✅ Email encriptado');
      }),

      switchMap((encryptedEmail) =>
        this.sessionService.getLastSession(encryptedEmail).pipe(
          tap(() => console.log('✅ Última sesión obtenida')),
          catchError((error) => {
            console.error('⚠️ Error al obtener última sesión (continuando):', error);
            return of(null);
          }),
        ),
      ),

      switchMap(() => {
        console.log('🌐 Obteniendo IP');
        return this.getIpService.getIPFromIpify();
      }),

      tap((ip: Ip) => console.log('✅ IP obtenida:', ip.ip)),

      switchMap((ip: Ip) => {
        console.log('📍 Obteniendo datos de ubicación');
        return this.getIpDataService.getIpLocationData<IpData>(ip.ip);
      }),

      tap((ipData: IpData) =>
        console.log('✅ Datos de ubicación obtenidos:', ipData.location.city),
      ),

      switchMap((ipData: IpData) => {
        console.log('💾 Iniciando guardado de sesión y notificación');
        const date = this.processDate(ipData.location.localtime, ipData.location.timezone);
        const formattedDate = this.addAcronyms(date);

        return forkJoin({
          session_notificate: this.sessionNotificateFlow(
            email,
            ipData,
            formattedDate,
          ).pipe(
            tap(() => console.log('✅ Notificación enviada')),
            catchError((error) => {
              console.error('❌ Error en notificationFlow:', error);
              return of<FlowResult>({
                complete: false,
                error: error.message,
                source: 'notification',
              });
            }),
          ),
          save_session: this.buildSaveSessionFlow(ipData, date).pipe(
            catchError((error) => {
              console.error('❌ Error en saveSession:', error);
              return of<FlowResult>({
                complete: false,
                error: error.message,
                source: 'save_session',
              });
            }),
          ),
        }).pipe(
          map((results) => {
            console.log('✅ forkJoin de sesión completado:', results);
            return results.save_session.complete
              ? { complete: true }
              : { complete: false, error: 'Error al guardar sesión' };
          }),
          tap((result) => console.log('🏁 startFlowForSession finalizado:', result)),
        );
      }),
    ).pipe(
      timeout({ each: 30000 }),
      retry({ count: 2, delay: 1000 }),

      catchError((error) => {
        console.error('❌ Error crítico en startFlowForSession:', error);
        return of<FlowResult>({
          complete: false,
          error: error.message ?? 'Error al procesar sesión',
        });
      }),
    );
  }

  private buildSaveSessionFlow(ipData: IpData, date: string): Observable<FlowResult> {
    return from(this.cryptoService.encryptAsync(ipData.ip, 'backend')).pipe(
      tap(() => console.log('✅ IP encriptada para guardado')),
      switchMap((encryptedIp) =>
        forkJoin({
          city: from(this.cryptoService.encryptAsync(ipData.location.city, 'backend')),
          latitude: from(
            this.cryptoService.encryptAsync(ipData.location.latitude.toString(), 'backend'),
          ),
          longitude: from(
            this.cryptoService.encryptAsync(ipData.location.longitude.toString(), 'backend'),
          ),
          timezone: from(this.cryptoService.encryptAsync(ipData.location.timezone, 'backend')),
        }).pipe(
          tap(() => console.log('✅ Datos de ubicación encriptados')),
          switchMap(({ city, latitude, longitude, timezone }) => {
            const location = {
              city,
              country: ipData.location.country,
              latitude,
              longitude,
              localtime: date,
              timezone,
            };
            console.log('💾 Guardando sesión en BD');
            return this.sessionService.saveSession(this.emailEncrypted, encryptedIp, location).pipe(
              tap(() => console.log('✅ Sesión guardada exitosamente')),
              map((): FlowResult => ({ complete: true, source: 'save_session' })),
            );
          }),
        ),
      ),
    );
  }

  sessionNotificateFlow(
    encryptedEmail: string,
    ipData: IpData,
    formattedDate: string,
  ): Observable<FlowResult> {
    console.log('📧 Iniciando sessionNotificateFlow');
    return this.patientService.validateSesStatus(encryptedEmail).pipe(
      map((status: string | null) => {
        if (status == null) {
          throw new Error('SES status is null or undefined');
        }
        console.log('✅ SES status validado:', status);
        return status;
      }),
      switchMap((patientResponse: string) => {
        const sesVerified = patientResponse === 'Email_verificado';
        console.log('📧 SES verificado:', sesVerified);
        return forkJoin({
          name: from(this.cryptoService.encryptAsync(this.storageService.getItem('name') || '')),
          cellphone: from(
            this.cryptoService.encryptAsync(this.storageService.getItem('cellphone') || ''),
          ),
          ip: from(this.cryptoService.encryptAsync(ipData.ip, 'backend')),
          geographic_location: from(
            this.cryptoService.encryptAsync(
              `${ipData.location.city}, ${ipData.location.country}`,
              'backend',
            ),
          ),
        }).pipe(
          tap(() => console.log('✅ Datos del paciente encriptados')),
          switchMap(({ name, cellphone, ip, geographic_location }) =>
            this.sendLoginMessage(
              sesVerified,
              { email: encryptedEmail, name, cellphone },
              formattedDate,
              ip,
              geographic_location,
            ),
          ),
        );
      }),
      catchError((error) => {
        console.error('❌ Error en sessionNotificateFlow:', error);
        return of<FlowResult>({ complete: false, error: error.message });
      }),
    );
  }
  private sendLoginMessage(
    sesVerified: boolean,
    patientData: PatientData,
    dateHour: string,
    ip: string,
    geographicLocation: string,
  ): Observable<FlowResult> {
    console.log('📤 Enviando mensaje de login a SQS');

    const loginMessage: LoginMessage = {
      message_type: 'login',
      channels: 'email',
      patient_email: patientData.email,
      cellphone: patientData.cellphone,
      patient_name: patientData.name,
      date_hour: dateHour,
      ip,
      geographic_location: geographicLocation,
      ses_verified: sesVerified,
    };

    return this.sqsService.sendSqsDirect(loginMessage, environment.sqs_notifications_url).pipe(
      tap(() => console.log('✅ Mensaje SQS enviado exitosamente')),
      map((): FlowResult => ({ complete: true })),
      catchError((error) => {
        console.error('❌ Error enviando mensaje SQS:', error);
        return of<FlowResult>({ complete: false, error: error.message });
      }),
    );

  }

  private processDate(dateService: string, timezone: string): string {
    const fecha = new Date(dateService + 'Z');
    const opciones: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('es-CO', opciones).format(fecha);
  }

  private addAcronyms(dateString: string): string {
    const [datePart, timePart] = dateString.split(', ');

    if (!datePart || !timePart) {
      console.error('❌ Formato de fecha inválido:', dateString);
      return 'Invalid Date';
    }

    const [day, month, year] = datePart.split('/');
    const [hoursStr, minutes, seconds] = timePart.split(':');

    if (!day || !month || !year || !hoursStr || !minutes || !seconds) {
      console.error('❌ Partes de fecha incompletas:', dateString);
      return 'Invalid Date';
    }

    const hours = Number.parseInt(hoursStr, 10);
    let acronym: string;
    if (hours === 12 && minutes === '00' && seconds === '00') {
      acronym = 'M';
    } else if (hours < 12) {
      acronym = 'AM';
    } else {
      acronym = 'PM';
    }

    const displayHours = hours === 0 || hours === 12 ? 12 : hours % 12;
    const formatted = `${year}-${month}-${day} ${displayHours.toString().padStart(2, '0')}:${minutes}:${seconds} ${acronym}`;

    console.log('✅ Fecha formateada para notificación:', formatted);
    return formatted;
  }
}