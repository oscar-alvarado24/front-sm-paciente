import { signIn } from '@aws-amplify/auth';

export interface CognitoResponse {
    nextStep: {
        signInStep: string;
      }
}

export type CognitoResponseWithNextStep = Awaited<ReturnType<typeof signIn>>;
