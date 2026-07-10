import { Injectable } from '@angular/core';
import { fetchAuthSession } from '@aws-amplify/auth';
import { SQSClient, SendMessageCommand, SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
type AuthSessionType = Awaited<ReturnType<typeof fetchAuthSession>>;


@Injectable({
  providedIn: 'root',
})
export class SqsService {
  sendSqsDirect<T>(message: T, queueUrl: string): Observable<SendMessageCommandOutput> {
  return from(fetchAuthSession()).pipe(
    switchMap((session: AuthSessionType) => {
      const creds = session.credentials;
      if (!creds?.accessKeyId) throw new Error('No valid credentials found');

      const sqs = new SQSClient({
        region: environment.cognito.region,
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          ...(creds.sessionToken && { sessionToken: creds.sessionToken })
        }
      });

      return from(sqs.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message)
      })));
    }),
    catchError(error => {
      console.error('Error sending SQS message:', error);
      return throwError(() => new Error('Error al enviar mensaje a SQS'));
    })
  );
}
}
