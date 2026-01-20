import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { AuthInitService } from './app/features/auth/auth-init.service';

bootstrapApplication(AppComponent, appConfig)
  .then((moduleRef) => {
    const authInitService = moduleRef.injector.get(AuthInitService);
    return authInitService.init();
  })
  .catch((err) => console.error(err));
