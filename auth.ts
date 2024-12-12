import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { getUser } from '@/app/lib/actions';
import type { DbUser } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';



export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials): Promise<any> {

        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(5) })
          .safeParse(credentials);

        console.log(parsedCredentials.success);
        console.log(parsedCredentials.data);

        if (parsedCredentials.success) {

          const { email, password } = parsedCredentials.data;
          console.log({ email, password });
          const user = await getUser(email);
          if (!user) return null;
          console.log(user);
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],

});