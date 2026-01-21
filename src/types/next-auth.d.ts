import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      numEmpleado: string;
      gerencia: string;
      rol: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    username: string;
    numEmpleado: string;
    gerencia: string;
    rol: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    numEmpleado: string;
    gerencia: string;
    rol: string;
  }
}
