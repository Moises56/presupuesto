import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findUserByUsernameOrEmail, updateLastAccess, registrarBitacora } from '@/lib/authDb';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Usuario o Email', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        try {
          const user = await findUserByUsernameOrEmail(identifier);

          if (!user) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.Password);

          if (!passwordMatch) {
            return null;
          }

          await updateLastAccess(user.Id);

          return {
            id: user.Id.toString(),
            name: `${user.Nombre} ${user.Apellido}`,
            email: user.Email,
            username: user.Username,
            numEmpleado: user.NumEmpleado,
            gerencia: user.Gerencia,
            rol: user.Rol,
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? '';
        token.username = user.username ?? '';
        token.numEmpleado = user.numEmpleado ?? '';
        token.gerencia = user.gerencia ?? '';
        token.rol = user.rol ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.username = token.username ?? '';
        session.user.numEmpleado = token.numEmpleado ?? '';
        session.user.gerencia = token.gerencia ?? '';
        session.user.rol = token.rol ?? '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  trustHost: true,
});
