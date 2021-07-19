import { Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, tap } from 'rxjs/operators';
import { loadStatements, restart } from './actions';
import { TreeFacade } from './facade';

@Injectable({ providedIn: 'root' })
export class TreeEffects {
  init$ = createEffect(() =>
    this._translate.onLangChange.pipe(
      switchMap(({ lang }) => [loadStatements({ lang }), restart()])
    )
  );

  dictionary$ = createEffect(
    () =>
      this._facade.dictionary$.pipe(
        tap((tree) => {
          this._translate.setTranslation(
            this._translate.currentLang,
            { tree },
            true
          );
        })
      ),
    {
      dispatch: false,
    }
  );

  constructor(
    private _translate: TranslateService,
    private _facade: TreeFacade
  ) {}
}
