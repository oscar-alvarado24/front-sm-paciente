import { Injectable } from '@angular/core';
import { Observable, from, switchMap, catchError, throwError } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SQS } from 'aws-sdk';

@Injectable({
  providedIn: 'root'
})
export class SqsService {

  constructor() { }

  sendSqsDirect(message: any, queueUrl: string): Observable<any> {
    return from(fetchAuthSession()).pipe(
      switchMap(session => {
        const creds = (session as any).credentials;
        if (!creds || !creds.accessKeyId) {
          throw new Error('No valid credentials found');
        }
        
        const sqs = new SQS({
          region: 'us-east-1',
          credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken
          }
        });

        const params = {
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message)
        };

        return from(sqs.sendMessage(params).promise());
      }),
      catchError(error => {
        console.error('Error sending SQS message:', error);
        return throwError(() => new Error('Error al enviar mensaje a SQS'));
      })
    );
  }

}
