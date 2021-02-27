import { InjectionToken, NgModule } from '@angular/core';
import { environment } from '../../environments/environment';
import { Game } from '../models';

export const CONFIG = new InjectionToken('config');

export interface Config {
  production: boolean;
  features: {
    editing: boolean;
  };
  endpoints: {
    commands: Record<Game, string>;
  };
}

@NgModule({
  providers: [
    {
      provide: CONFIG,
      useValue: environment,
    },
  ],
})
export class ConfigModule {}