import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, merge } from 'rxjs';
import {
  changePage,
  displayClassOverview,
  displayOrEditCommandInfo,
  displayOrEditEnum,
  displayOrEditSnippet,
  resetFilters,
  scrollTop,
  selectClass,
  selectExtensions,
  stopEditOrDisplay,
  toggleAttribute,
  updateSearchTerm,
} from './actions';
import {
  filter,
  map,
  mapTo,
  pairwise,
  switchMap,
  tap,
  withLatestFrom,
  startWith,
  groupBy,
  mergeMap,
  first,
} from 'rxjs/operators';
import { UiFacade } from './facade';
import {
  Entity,
  EnumRaw,
  Enums,
  Extension,
  Game,
  ViewMode,
} from '../../models';
import { SnippetsFacade } from '../snippets/facade';
import { ExtensionsFacade } from '../extensions/facade';
import { ChangesFacade } from '../changes/facade';
import { onListEnter } from '../game/actions';
import { GameFacade } from '../game/facade';
import { EnumsFacade } from '../enums/facade';
import { capitalizeFirst } from 'src/app/utils';

@Injectable({ providedIn: 'root' })
export class UiEffects {
  viewOnLoad$ = createEffect(() =>
    this._actions$.pipe(
      ofType(onListEnter),
      switchMap(({ opcode, extension, enumName, className }) => {
        if (enumName) {
          return this._enums.enums$.pipe(
            first<Enums>(Boolean),
            map((enums) => {
              const name = capitalizeFirst(enumName);
              const isNew = !enums?.[name];
              const enumToEdit: EnumRaw = {
                name,
                isNew,
                fields: Object.entries(enums?.[name] ?? []),
              };
              return displayOrEditEnum({
                enumToEdit,
                viewMode: isNew ? ViewMode.EditEnum : ViewMode.ViewEnum,
              });
            })
          );
        }

        if (className) {
          return this._extensions.getExtensionEntities(extension).pipe(
            first<Entity[]>(Boolean),
            map((entities) => {
              if (entities.some((e) => e.name === className)) {
                return displayClassOverview({ className });
              } else {
                return stopEditOrDisplay();
              }
            })
          );
        }

        return this._extensions.extensions$.pipe(
          first<Extension[]>(Boolean),
          map((extensions) => {
            const command = extensions
              .find((e) => e.name === extension)
              ?.commands.find(({ id }) => id === opcode);

            if (command) {
              return displayOrEditCommandInfo({
                command,
                extension,
                viewMode: ViewMode.ViewCommand,
              });
            } else {
              return stopEditOrDisplay();
            }
          })
        );
      })
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

  resetPagination$ = createEffect(() =>
    merge(
      this._actions$.pipe(
        ofType(toggleAttribute, selectExtensions, selectClass, updateSearchTerm)
      ),
      this._actions$.pipe(ofType(onListEnter)).pipe(filter((x) => !x.opcode))
    ).pipe(mapTo(changePage({ index: 1 })))
  );

  commandPage$ = createEffect(() =>
    combineLatest([this._ui.rows$, this._ui.commandToDisplayOrEdit$]).pipe(
      map(([rows, command]) =>
        rows?.findIndex((row) => row.command?.id === command?.id)
      ),
      withLatestFrom(this._ui.currentPage$),
      filter(([index, currentPage]) => index >= 0 && currentPage !== index),
      map(([index]) => changePage({ index: Math.ceil((index + 1) / 100) }))
    )
  );

  scrollTop$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(scrollTop),
        tap(() => {
          window.scroll(0, 0);
        })
      ),
    { dispatch: false }
  );

  changesCount$ = createEffect(
    () =>
      this._changes.changesCount$.pipe(
        tap((changesCount) => {
          this._d.body.classList[changesCount > 0 ? 'add' : 'remove'](
            'has-unsubmitted-changes'
          );
        })
      ),
    { dispatch: false }
  );

  /**
   * for each game, subscribe to extension list changes
   * then calculate a diff between previous and current extensions
   * and update selected extensions accordingly
   */
  extensionChanges$ = createEffect(() =>
    this._game.game$.pipe(
      groupBy((game) => game),
      mergeMap((game$) =>
        game$.pipe(
          mergeMap((game) =>
            this._extensions
              .getGameExtensions(game)
              .pipe(map((extensions) => ({ extensions, game })))
          ),
          startWith({ extensions: [] as Extension[] }),
          pairwise(),
          switchMap(
            ([prev, curr]: [
              { extensions: Extension[] },
              { extensions: Extension[]; game: Game }
            ]) => {
              const p = prev.extensions.map(({ name }) => name);
              const c = curr.extensions.map(({ name }) => name);
              const game = curr.game;

              const added = c.filter((e) => !p.includes(e));
              const removed = p.filter((e) => !c.includes(e));

              return [
                selectExtensions({ game, extensions: added, state: true }),
                selectExtensions({ game, extensions: removed, state: false }),
              ].filter(({ extensions }) => extensions.length > 0);
            }
          )
        )
      )
    )
  );

  resetFilters$ = createEffect(() =>
    this._actions$.pipe(
      ofType(resetFilters),
      withLatestFrom(this._extensions.extensionNames$, this._game.game$),
      map(([_, extensions, game]) =>
        selectExtensions({ game, extensions, state: true })
      )
    )
  );

  constructor(
    private _actions$: Actions,
    private _ui: UiFacade,
    private _snippets: SnippetsFacade,
    private _extensions: ExtensionsFacade,
    private _changes: ChangesFacade,
    private _game: GameFacade,
    private _enums: EnumsFacade,
    @Inject(DOCUMENT) private _d: Document
  ) {}
}
