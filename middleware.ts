import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialisation sécurisée du client Supabase (Version Next.js 15+ sans warning ESLint)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies de la requête
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Recréer la réponse avec les nouveaux headers de requête
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // Mettre à jour les cookies de la réponse pour le navigateur
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 2. Récupération sécurisée de l'utilisateur (Déclenche le rafraîchissement automatique des tokens)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  
  // Définition des groupes de routes
  const isOwnerRoute = pathname.startsWith('/owner');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProtectedRoute = isDashboardRoute || isOwnerRoute;
  const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register';

  // Extraction propre du rôle depuis les métadonnées de l'utilisateur
  const role = user?.user_metadata?.role;

  // 🔍 LOGS DE TEST (Tes mouchards pour la console)
  console.log("=== 🛣️ PASSAGE MIDDLEWARE ===");
  console.log(" Target URL :", pathname);
  console.log(" User Status :", user ? `Connecté (${role})` : "Non connecté");

  // RÈGLE UNIQUE 1 : Si l'utilisateur n'est pas connecté et tente d'accéder à une page privée
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    
    const redirectRes = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  }

  // RÈGLE UNIQUE 2 : Si l'utilisateur est déjà connecté et tente d'aller sur Login/Register
  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    
    const redirectRes = NextResponse.redirect(dashboardUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  }

  // RÈGLE UNIQUE 3 : Bloquer un employé qui tente de forcer une route /owner
  if (role === 'employee' && isOwnerRoute) {
    console.log("🚫 ACCÈS SÉCURISÉ : Employé bloqué, redirection automatique !");
    
    // Redirection vers l'URL 
    const salesUrl = new URL('/dashboard/employee/ventes', request.url);
    return NextResponse.redirect(salesUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};