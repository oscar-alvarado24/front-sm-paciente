import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionService } from '../../session/service/session.service';
import { StorageService } from '../../../../commons/service/localStotarage/local-storage.service';
import { GetIpService } from '../../get-ip/service/get-ip.service';
import { GetIpDataService } from '../../get-ip-location-data/service/get-ip-data.service';
import { IpData } from '../../get-ip-location-data/interface/ip-data';
import { catchError, map, retry, switchMap, timeout, tap } from 'rxjs/operators';
import { Ip } from '../../get-ip/interface/ip';
import { CryptoService } from '../../../../commons/service/crypto/crypto.service';
import { Observable } from 'rxjs/internal/Observable';
import { from, throwError, forkJoin, of } from 'rxjs';
import { SqsService } from '../../../../commons/service/sqs/sqs.service';
import { PatientService } from 'src/app/commons/service/graphQL/patient-st/patient-st.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GetAndSaveSessionService {

  constructor(
    private readonly http: HttpClient,
    private readonly sessionService: SessionService,
    private readonly storageService: StorageService,
    private readonly getIpService: GetIpService,
    private readonly getIpDataService: GetIpDataService,
    private readonly cryptoService: CryptoService,
    private readonly patientService: PatientService,
    private readonly sqsService: SqsService
  ) { }

  startFlowForSession(): Observable<any> {
    console.log('🔐 Iniciando startFlowForSession');
    let emailEncrypted = '';

    return from(this.cryptoService.encryptAsync(this.storageService.getItem("email"), 'post')).pipe(
      tap(encrypted => {
        emailEncrypted = encrypted;
        console.log('✅ Email encriptado');
      }),
      switchMap((encryptedEmail: string) => {
        console.log('📋 Obteniendo última sesión');
        return this.sessionService.getLastSession(encryptedEmail).pipe(
          tap(() => console.log('✅ Última sesión obtenida')),
          catchError(error => {
            console.error('⚠️ Error al obtener última sesión (continuando):', error);
            return of(null); // Continuar aunque falle
          })
        );
      }),
      switchMap(() => {
        console.log('🌐 Obteniendo IP');
        return this.getIpService.getIPFromIpify();
      }),
      tap(ip => console.log('✅ IP obtenida:', ip.ip)),
      switchMap((ip: Ip) => {
        console.log('📍 Obteniendo datos de ubicación');
        return this.getIpDataService.getIpLocationData<IpData>(ip.ip);
      }),
      tap(ipData => console.log('✅ Datos de ubicación obtenidos:', ipData.location.city)),
      switchMap((ipData: IpData) => {
        console.log('💾 Iniciando guardado de sesión y notificación');
        const date = this.processDate(ipData.location.localtime, ipData.location.timezone);
        const saveSession$ = from(this.cryptoService.encryptAsync(ipData.ip, 'post')).pipe(
          tap(() => console.log('✅ IP encriptada para guardado')),
          switchMap((encryptedIp: string) =>
            forkJoin({
              city: from(this.cryptoService.encryptAsync(ipData.location.city, 'post')),
              latitude: from(this.cryptoService.encryptAsync(ipData.location.latitude.toString(), 'post')),
              longitude: from(this.cryptoService.encryptAsync(ipData.location.longitude.toString(), 'post')),
              timezone: from(this.cryptoService.encryptAsync(ipData.location.localtime, 'post'))
            }).pipe(
              tap(() => console.log('✅ Datos de ubicación encriptados')),
              switchMap(({ city, latitude, longitude, timezone }) => {
                const location = {
                  city: city,
                  country: ipData.location.country,
                  latitude: latitude,
                  longitude: longitude,
                  localtime: date,
                  timezone: timezone
                };
                console.log('💾 Guardando sesión en BD');

                return this.sessionService.saveSession(emailEncrypted, encryptedIp, location).pipe(
                  tap(() => console.log('✅ Sesión guardada exitosamente')),
                  map(() => ({ complete: true, source: 'save_session' }))
                );
              })
            )
          ),
          catchError(error => {
            console.error('❌ Error en saveSession:', error);
            return of({ complete: false, error: error.message, source: 'save_session' });
          })
        );
        ipData.location.localtime = this.addAcronyms(date);
        const notificationFlow$ = this.sessionNotificateFlow(emailEncrypted, ipData).pipe(
          tap(() => console.log('✅ Notificación enviada')),
          catchError(error => {
            console.error('❌ Error en notificationFlow:', error);
            return of({ complete: false, error: error.message, source: 'notification' });
          })
        );

        return forkJoin({
          session_notificate: notificationFlow$,
          save_session: saveSession$
        }).pipe(
          map(results => {
            console.log('✅ forkJoin de sesión completado:', results);
            // Considerar exitoso si al menos saveSession funcionó
            if (results.save_session.complete) {
              return { complete: true };
            }
            return { complete: false, error: 'Error al guardar sesión' };
          }),
          tap(result => console.log('🏁 startFlowForSession finalizado:', result))
        );
      }),
      timeout(30000), // 30 segundos timeout
      retry({
        count: 2,
        delay: 1000 // 1 segundo entre reintentos
      }),
      catchError(error => {
        console.error('❌ Error crítico en startFlowForSession:', error);
        // Retornar objeto con complete: false en lugar de throwError
        return of({ complete: false, error: error.message || 'Error al procesar sesión' });
      })
    );
  }

  sessionNotificateFlow(encryptedEmail: string, ipData: IpData): Observable<any> {
    console.log('📧 Starting sessionNotificateFlow');

    return this.patientService.validateSesStatus(encryptedEmail).pipe(
      tap(status => console.log('✅ SES status validado:', status)),
      switchMap((patientResponse: string) => {
        const ses_verified_result = patientResponse === 'Email_verificado';
        console.log('📧 SES verificado:', ses_verified_result);

        return forkJoin({
          name: from(this.cryptoService.encryptAsync(this.storageService.getItem("name"))),
          cellphone: from(this.cryptoService.encryptAsync(this.storageService.getItem("cellphone"))),
          ip: from(this.cryptoService.encryptAsync(ipData.ip, 'post')),
          geographic_location: from(this.cryptoService.encryptAsync(`${ipData.location.city}, ${ipData.location.country}`, 'post'))
        }).pipe(
          tap(data => console.log('✅ Datos del paciente encriptados para ser enviados')),
          switchMap(({ name, cellphone, ip, geographic_location }) => {
            const patientData = {
              email: encryptedEmail,
              name: name,
              cellphone: cellphone
            };
            return this.sendLoginMessage(ses_verified_result, patientData, ipData, ip, geographic_location);
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error en sessionNotificateFlow:', error);
        return of({ complete: false, error: error.message });
      })
    );
  }

  sendLoginMessage(ses_verified_result: boolean, patientData: any, ipData: IpData, ip: string, geographic_location: string): Observable<any> {
    console.log('📤 Enviando mensaje de login a SQS');

    const loginMessage = {
      message_type: 'login',
      channels: 'email-cellphone',
      patient_email: patientData.email,
      cellphone: patientData.cellphone,
      patient_name: patientData.name,
      date_hour: ipData.location.localtime.replace('T', ' '),
      ip: ip,
      geographic_location: geographic_location,
      ses_verified: ses_verified_result
    };

    return this.sqsService.sendSqsDirect(loginMessage, environment.sqs_notifications_url).pipe(
      tap(() => console.log('✅ Mensaje SQS enviado exitosamente')),
      map(() => ({ complete: true })),
      catchError(error => {
        console.error('❌ Error enviando mensaje SQS:', error);
        return of({ complete: false, error: error.message });
      })
    );
  }

  processDate(dateService: string, timezone: string): string {

    const fecha = new Date(dateService+'Z');

    // Formatear con la zona horaria específica
    const opciones: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    return new Intl.DateTimeFormat('es-CO', opciones).format(fecha);

  }

  addAcronyms(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Determinar acrónimo
    let acronym: string;
    if (hours === 0 && minutes === '00' ) {
      acronym = 'AM';
    } else if (hours === 12 && minutes === '00' && seconds === '00') {
      acronym = 'M';
    } else if (hours < 12) {
      acronym = 'AM';
    } else {
      acronym = 'PM';
    }

    // Convertir a formato 12 horas
    const displayHours = hours === 0 || hours === 12 ? 12 : hours % 12;

    return `${year}-${month}-${day} ${displayHours.toString().padStart(2, '0')}:${minutes}:${seconds} ${acronym}`;
  }
}