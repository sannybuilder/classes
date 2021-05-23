import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, withLatestFrom } from 'rxjs/operators';

import { loadClasses, loadClassesSuccess } from './actions';
import { AuthFacade } from '../auth/facade';
import { ClassesService } from './service';

@Injectable({ providedIn: 'root' })
export class ClassesEffects {
  loadClasses$ = createEffect(() =>
    this._actions$.pipe(
      ofType(loadClasses),
      withLatestFrom(this._auth.authToken$),
      concatMap(([{ game }, accessToken]) =>
        this._service
          .loadClasses(game, accessToken)
          .pipe(map((classes) => loadClassesSuccess({ game, classes })))
      )
    )
  );

  constructor(
    private _actions$: Actions,
    private _service: ClassesService,
    private _auth: AuthFacade
  ) {}
}
