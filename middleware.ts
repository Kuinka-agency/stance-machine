export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/api/auth/:path*', '/api/save-stance-card'],
}
