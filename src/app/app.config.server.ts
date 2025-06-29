import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SupabaseService } from './services/supabase.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRouting(serverRoutes),
    SupabaseService
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
