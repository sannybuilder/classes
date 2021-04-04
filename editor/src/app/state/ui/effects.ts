import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  changePage,
  displayOrEditCommandInfo,
  displayOrEditSnippet,
  loadSupportInfo,
  loadSupportInfoSuccess,
  stopEditOrDisplay,
  toggleFilter,
  updateSearchTerm,
} from './actions';
import {
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { UiFacade } from './facade';
import { ViewMode } from '../../models';
import { combineLatest } from 'rxjs';
import {
  loadExtensionsSuccess,
  toggleExtension,
  updateCommand,
} from '../extensions/actions';
import { SnippetsFacade } from '../snippets/facade';
import { UiService } from './service';

@Injectable({ providedIn: 'root' })
export class UiEffects {
  viewOpcodeOnLoad$ = createEffect(() =>
    combineLatest([
      this._actions$.pipe(ofType(loadExtensionsSuccess)),
      this._ui.opcodeOnLoad$,
      this._ui.game$,
    ]).pipe(
      filter(([{ game }, _, currGame]) => game === currGame),
      map(([{ extensions }, { opcode, extension }]) => {
        const command = extensions
          .find((e) => e.name === extension)
          ?.commands.find(({ id }) => id === opcode);

        if (command) {
          return displayOrEditCommandInfo({
            command,
            extension,
            viewMode: ViewMode.View,
          });
        } else {
          return stopEditOrDisplay();
        }
      })
    )
  );

  onGameChange$ = createEffect(() =>
    this._ui.game$.pipe(map((game) => loadSupportInfo({ game })))
  );

  updateCommand$ = createEffect(() =>
    this._actions$.pipe(
      ofType(updateCommand),
      map(({ command, newExtension: extension }) =>
        displayOrEditCommandInfo({
          command,
          extension,
          viewMode: ViewMode.Edit,
        })
      )
    )
  );

  displayOrEditSnippet$ = createEffect(() =>
    this._actions$.pipe(
      ofType(displayOrEditCommandInfo),
      switchMap(({ command, extension }) =>
        this._snippets.getSnippet(extension, command.id)
      ),
      map((snippet) => displayOrEditSnippet({ snippet }))
    )
  );

  loadSupportInfo$ = createEffect(() =>
    this._actions$.pipe(
      ofType(loadSupportInfo),
      switchMap(({ game }) => this._service.loadSupportInfo(game)),
      map((supportInfo) => loadSupportInfoSuccess({ supportInfo }))
    )
  );

  pageEvents$ = createEffect(() =>
    this._route.queryParams.pipe(
      map((params) => {
        const p = params?.p;
        return p === 'all' ? p : +p;
      }),
      distinctUntilChanged(),
      filter((p): p is number | 'all' => p === 'all' || +p > 0),
      map((index) => changePage({ index }))
    )
  );

  resetPagination$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(toggleFilter, toggleExtension, updateSearchTerm),
        tap(() => {
          const [url] = this._router.url.split('?');
          this._router.navigate([url], {
            queryParams: { p: 1 },
            queryParamsHandling: 'merge',
          });
        })
      ),
    {
      dispatch: false,
    }
  );

  constructor(
    private _actions$: Actions,
    private _ui: UiFacade,
    private _snippets: SnippetsFacade,
    private _service: UiService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}
}
