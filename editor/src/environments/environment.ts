// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Game } from '../app/models';
import { Config } from '../app/config';

export const environment: Config = {
  production: false,
  features: {
    shouldBeAuthorizedToEdit: false,
  },
  endpoints: {
    snippets: {
      [Game.GTA3]: '/assets/gta3_snippets.json',
      [Game.VC]: '/assets/vc_snippets.json',
    },
    extensions: {
      [Game.GTA3]: '/assets/gta3.json',
      [Game.VC]: '/assets/vc.json',
    },
    oauth: 'https://github.com/login/oauth/authorize',
    user: 'https://api.github.com/user',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.