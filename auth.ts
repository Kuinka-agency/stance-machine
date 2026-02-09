import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import PostgresAdapter from '@auth/pg-adapter'
import { cookies } from 'next/headers'
import { getPool, stitchSessionToUser } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(getPool()),
  session: { strategy: 'jwt' },
  providers: [
    Resend({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    }),
  ],
  pages: {
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, user object is available — persist user.id into the JWT
      if (user?.id) {
        token.userId = user.id

        // Stitch anonymous votes: read session_id from cookie set before sign-in
        try {
          const cookieStore = await cookies()
          const sessionId = cookieStore.get('stance_session_id')?.value
          if (sessionId) {
            await stitchSessionToUser(sessionId, user.id)
          }
        } catch {
          // Cookie read can fail in some edge cases — not fatal
        }
      }
      return token
    },
    async session({ session, token }) {
      // Expose user.id on the client-side session
      if (token.userId) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
})
