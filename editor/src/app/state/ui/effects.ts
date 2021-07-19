import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, merge } from 'rxjs';
import {
  changePage,
  displayClassesList,
  displayClassOverview,
  displayDecisionTree,
  displayEnumsList,
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
  take,
} from 'rxjs/operators';

import { Entity, Enums, Extension, Game, ViewMode } from '../../models';

import { capitalizeFirst } from '../../utils';
import { flatMap } from 'lodash';
import { UiFacade } from './facade';
import { SnippetsFacade } from '../snippets/facade';
import { ExtensionsFacade } from '../extensions/facade';
import { ChangesFacade } from '../changes/facade';
import { onListEnter } from '../game/actions';
import { GameFacade } from '../game/facade';
import { EnumsFacade } from '../enums/facade';
import { opcodify } from '../../pipes';

@Injectable({ providedIn: 'root' })
export class UiEffects {
  viewOnLoad$ = createEffect(() =>
    this._actions$.pipe(
      ofType(onListEnter),
      withLatestFrom(this._ui.canEdit$),
      switchMap(
        ([
          { opcode, extension, enumName, className, action, searchTerm },
          canEdit,
        ]) => {
          if (action === 'decision-tree') {
            return [displayDecisionTree()];
          }
          if (enumName) {
            if (enumName === 'all') {
              return [displayEnumsList()];
            }
            return this._enums.enums$.pipe(
              first((v): v is Enums => !!v),
              map((enums) => {
                const name =
                  enumName.toLowerCase() === 'new'
                    ? ''
                    : capitalizeFirst(enumName);
                const enumToEdit = enums[name];
                const isNew = !enumToEdit;

                if (isNew) {
                  if (!canEdit) {
                    return stopEditOrDisplay();
                  }
                  return displayOrEditEnum({
                    enumToEdit: { isNew, name, fields: [] },
                    viewMode: ViewMode.EditEnum,
                  });
                }

                return displayOrEditEnum({
                  enumToEdit: {
                    isNew,
                    name,
                    fields: Object.entries(enumToEdit),
                  },
                  viewMode:
                    action === 'edit' ? ViewMode.EditEnum : ViewMode.ViewEnum,
                });
              })
            );
          }

          if (className) {
            if (className === 'all') {
              return [displayClassesList()];
            }
            return this._extensions.entities$.pipe(
              first((v): v is Record<string, Entity[]> => !!v),
              map((entities) => {
                if (flatMap(entities).some((e) => e.name === className)) {
                  return displayClassOverview({ className });
                } else {
                  return stopEditOrDisplay();
                }
              })
            );
          }

          if (opcode && extension) {
            return this._extensions.extensions$.pipe(
              first<Extension[]>(Boolean),
              map((extensions) => {
                const commandId =
                  opcode.toLowerCase() === 'new' ? '' : opcodify(opcode);
                const commandToEdit = extensions
                  .find((e) => e.name === extension)
                  ?.commands.find(({ id }) => id === commandId);

                const isNew = !commandToEdit;
                if (isNew) {
                  if (!canEdit) {
                    return stopEditOrDisplay();
                  }
                  return displayOrEditCommandInfo({
                    extension,
                    command: {
                      id: commandId,
                      name: '',
                      num_params: 0,
                    },
                    viewMode: ViewMode.EditCommand,
                  });
                }

                return displayOrEditCommandInfo({
                  extension,
                  command: commandToEdit!,
                  viewMode:
                    action === 'edit'
                      ? ViewMode.EditCommand
                      : ViewMode.ViewCommand,
                });
              })
            );
          }

          if (searchTerm) {
            return [
              updateSearchTerm({ searchTerm, autoOpenSingleResult: true }),
            ];
          }

          return [stopEditOrDisplay()];
        }
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
      filter(
        ([index, currentPage]) =>
          index !== undefined && index >= 0 && currentPage !== index
      ),
      map(([index]) => changePage({ index: Math.ceil((index! + 1) / 100) }))
    )
  );

  updateSearchTerm$ = createEffect(() =>
    this._actions$.pipe(
      ofType(updateSearchTerm),
      filter(({ autoOpenSingleResult }) => !!autoOpenSingleResult),
      switchMap(() =>
        // note: flatten this observable to make this logic only work once in the app lifetime
        this._ui.selectedExtensions$.pipe(
          filter((e) => !!e?.length),
          take(1),
          switchMap(() => this._ui.rows$),
          take(1),
          filter((rows) => rows?.length === 1)
        )
      ),
      map((rows) =>
        displayOrEditCommandInfo({
          command: rows![0].command,
          extension: rows![0].extension!,
          viewMode: ViewMode.ViewCommand,
        })
      )
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

  hasChanges$ = createEffect(
    () =>
      this._changes.hasChanges$.pipe(
        tap((hasChanges) => {
          this._d.body.classList[hasChanges ? 'add' : 'remove'](
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
          pairwise<{ extensions: Extension[]; game?: Game }>(),
          switchMap(([prev, curr]) => {
            const p = prev.extensions.map(({ name }) => name);
            const c = curr.extensions.map(({ name }) => name);
            const game = curr.game!;

            const added = c.filter((e) => !p.includes(e));
            const removed = p.filter((e) => !c.includes(e));

            return [
              selectExtensions({ game, extensions: added, state: true }),
              selectExtensions({ game, extensions: removed, state: false }),
            ].filter(({ extensions }) => extensions.length > 0);
          })
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
