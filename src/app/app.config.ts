// app.config.ts
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './features/auth/auth.interceptor';
import { AuthInitService } from './features/auth/auth-init.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // new route => top, back/forward => restore
        anchorScrolling: 'enabled',           // optional: support #fragment
      })
    ),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(ReactiveFormsModule),
    {
      provide: APP_INITIALIZER,
      useFactory: (authInit: AuthInitService) => () => authInit.init(),
      deps: [AuthInitService],
      multi: true,
    },
  ],
};
