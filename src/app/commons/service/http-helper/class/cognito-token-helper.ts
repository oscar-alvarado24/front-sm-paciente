export class CognitoTokenHelper {
    static getAccessToken(): string | null {
    const prefix = 'CognitoIdentityServiceProvider.';
    const suffix = '.accessToken';
    
    try {
      // Buscar en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key.endsWith(suffix)) {
          const token = localStorage.getItem(key);
          if (token && token !== 'null' && token !== 'undefined') {
            return token;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo token de Cognito:', error);
      return null;
    }
  }
}
