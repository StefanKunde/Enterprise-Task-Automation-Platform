# Task Automation Frontend

Angular 19 application showcasing modern frontend architecture patterns. Built to demonstrate reactive state management, authentication flows, and component organization.

🔗 **Live Demo:** https://stefankunde.github.io/Enterprise-Task-Automation-Platform/

## What it is

Frontend portfolio project demonstrating Angular best practices:
- JWT authentication with automatic token refresh
- RxJS reactive state management
- Route guards with return URL preservation
- HTTP interceptors for auth headers
- Standalone components (Angular 19)
- Tailwind CSS utility-first styling

## Tech Stack

- **Angular 19.2** - Latest framework version with standalone components
- **TypeScript 5.7** - Strict mode
- **RxJS 7.8+** - Reactive programming
- **Tailwind CSS 4** - Utility-first styling
- **Angular Router** - Client-side routing
- **Reactive Forms** - Form handling

## Key Patterns

**1. Authentication Service**
```typescript
// BehaviorSubject for reactive auth state
private currentUserSubject = new BehaviorSubject<User | null>(null);
currentUser$ = this.currentUserSubject.asObservable();

// Token management
login(credentials: LoginDto): Observable<AuthResponse> {
  return this.http.post<AuthResponse>('/auth/login', credentials)
    .pipe(
      tap(response => {
        localStorage.setItem('access_token', response.accessToken);
        this.currentUserSubject.next(response.user);
      })
    );
}
```

**2. HTTP Interceptor**
```typescript
// Automatic authorization header injection
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('access_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}
```

**3. Route Guards**
```typescript
// CanActivateFn with return URL
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

## Architecture

```
src/
├── app/
│   ├── core/              # Singletons (services, guards, interceptors)
│   │   ├── services/      # AuthService, ApiService
│   │   ├── guards/        # authGuard, roleGuard
│   │   └── interceptors/  # authInterceptor, errorInterceptor
│   ├── features/          # Feature modules (lazy-loaded)
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   └── profile/
│   └── shared/            # Reusable components
│       ├── components/
│       └── pipes/
```

## Features

- ✅ Email/password authentication
- ✅ JWT token persistence
- ✅ Protected routes with guards
- ✅ HTTP error handling
- ✅ Reactive forms with validation
- ✅ Lazy loading for 3+ routes
- ✅ Responsive design (Tailwind)

## Performance

- Initial bundle: <250KB (with tree-shaking)
- Lazy loading: 3+ routes load on demand
- Build time: <30 seconds
- Lighthouse score: 95+ (performance, accessibility, best practices)

## Setup

```bash
npm install
ng serve
# Navigate to http://localhost:4200
```

**Note:** This is frontend-only. Full functionality requires the [Task Execution API](https://github.com/StefanKunde/Enterprise-Task-Execution-Platform-API) backend.

## Build

```bash
ng build --configuration production
# Output: dist/
```

## What I Learned

- Angular 19 standalone components (no NgModules)
- RxJS operators (tap, map, switchMap, catchError)
- JWT lifecycle management (access + refresh)
- HTTP interceptor patterns
- Route guard composition
- TypeScript strict mode benefits
- Tailwind CSS workflow
- Modern Angular build optimization

## Design Decisions

**Why BehaviorSubject for auth state?**
- Stores current value (unlike regular Subject)
- New subscribers get latest value immediately
- Perfect for "current user" state

**Why localStorage for tokens?**
- Simple and works for this demo
- Production would use httpOnly cookies for better security

**Why standalone components?**
- Simpler than NgModules
- Less boilerplate
- Better tree-shaking
- Future direction for Angular

## Live Demo Limitations

The live demo is frontend-only (no backend), so:
- Authentication doesn't actually work
- API calls will fail
- It's just to show the UI/UX

For full functionality, run both frontend and backend locally.

## License

MIT

## Author

Stefan Kunde
