import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, zip } from 'rxjs';
import { Router } from '@angular/router';
import {
  tap,
  switchMap,
  withLatestFrom,
  concatMap,
  map,
  take,
  filter,
} from 'rxjs/operators';
import { flatMap, groupBy, flatten } from 'lodash';

import {
  cloneCommand,
  GameCommandUpdate,
  initSupportInfo,
  loadExtensions,
  loadExtensionsSuccess,
  updateCommands,
  updateGameCommands,
} from './actions';
import { ExtensionsService } from './service';
import { ExtensionsFacade } from './facade';
import { ChangesFacade } from '../changes/facade';
import {
  Command,
  Game,
  GameLibrary,
  GameVersion,
  PrimitiveType,
} from '../../models';
import {
  commandParams,
  getSameCommands,
  doesCommandHaveAnyAttributeInvalid,
  replaceType,
} from '../../utils';
import { AuthFacade } from '../auth/facade';
import { GameFacade } from '../game/facade';
import { renameGameEnum } from '../enums/actions';
import { registerFileContent } from '../changes/actions';

@Injectable({ providedIn: 'root' })
export class ExtensionsEffects {
  loadExtensions$ = createEffect(() =>
    this._actions$.pipe(
      ofType(loadExtensions),
      withLatestFrom(this._auth.authToken$),
      concatMap(([{ game }, accessToken]) =>
        this._service.loadExtensions(game, accessToken).pipe(
          switchMap((response) => [
            loadExtensionsSuccess({
              game,
              extensions: response.extensions,
              lastUpdate: response.meta.last_update,
              version: response.meta.version,
            }),
            registerFileContent({
              fileName: GameLibrary[game],
              lastUpdate: response.meta.last_update,
              content: JSON.stringify(response, null, 2),
            }),
          ])
        )
      )
    )
  );

  updateCommands$ = createEffect(() =>
    this._actions$.pipe(
      ofType(updateCommands),
      withLatestFrom(this._game.game$),
      switchMap(([{ batch }, game]) => {
        return zip(
          ...batch.map(({ command, newExtension, oldExtension }) => {
            // find copies of this command in other games to propagate the changes
            if (command.id && command.name) {
              return this._extensions
                .getCommandSupportInfo(command, oldExtension)
                .pipe(
                  withLatestFrom(
                    this._extensions.getExtensionCommand({
                      id: command.id,
                      extension: oldExtension,
                    })
                  ),
                  take(1),
                  map(([supportInfo, oldCommand]) => {
                    if (shouldUpdateOtherGames(command, oldCommand)) {
                      return getSameCommands(supportInfo, game).map((d) => ({
                        game: d.game,
                        command,
                        newExtension,
                        oldExtension,
                      }));
                    } else {
                      return {
                        game,
                        command,
                        newExtension,
                        oldExtension,
                      };
                    }
                  })
                );
            } else {
              // if there is no id or name (deleting flow) - update only this game
              return of([
                {
                  game,
                  command,
                  newExtension,
                  oldExtension,
                },
              ]);
            }
          })
        );
      }),
      switchMap((updates) => {
        const groups = groupBy(flatten(updates), 'game');

        return [
          ...Object.entries(groups).map(([game, batch]) =>
            updateGameCommands({
              game: game as Game,
              batch: batch as GameCommandUpdate[],
            })
          ),
          initSupportInfo(),
        ];
      })
    )
  );

  updateGameCommands$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(updateGameCommands),
        // distinctUntilChanged<ReturnType<typeof updateGameCommands>>(isEqual),
        switchMap(({ game }) =>
          this._extensions.getGameExtensions(game).pipe(
            withLatestFrom(this._extensions.getGameVersion(game)),
            tap(([extensions, oldVersion]) => {
              const version = bumpVersion(oldVersion);
              this._changes.registerExtensionsChange({
                version,
                fileName: GameLibrary[game],
                content: extensions,
                url: 'https://library.sannybuilder.com/#/' + game,
              });
              this._changes.registerTextFileChange(GameVersion[game], version);
            })
          )
        )
      ),
    { dispatch: false }
  );

  renameEnum$ = createEffect(() =>
    this._actions$.pipe(
      ofType(renameGameEnum),
      switchMap(({ game, oldEnumName, newEnumName }) =>
        this._extensions.getGameExtensions(game).pipe(
          // take(1),
          switchMap((extensions) => {
            const affectedCommands = flatMap(extensions, (extension) =>
              extension.commands
                .filter((c) =>
                  commandParams(c).some((p) => p.type === oldEnumName)
                )
                .map((c) => ({
                  extension: extension.name,
                  command: {
                    ...c,
                    input: replaceType(
                      c.input,
                      oldEnumName,
                      newEnumName || PrimitiveType.any
                    ),
                    output: replaceType(
                      c.output,
                      oldEnumName,
                      newEnumName || PrimitiveType.any
                    ),
                  },
                }))
            );
            return zip(
              ...affectedCommands.map(({ extension, command }) => {
                return this._extensions.getCommandSupportInfo(
                  command,
                  extension
                );
              })
            ).pipe(
              take(1),
              map((supportInfos) => {
                const otherGames = new Set<Game>();
                for (const info of supportInfos) {
                  const sameCommands = getSameCommands(info, game);
                  sameCommands.forEach((sameCommand) =>
                    otherGames.add(sameCommand.game)
                  );
                }
                otherGames.delete(game);
                return {
                  otherGames: [...otherGames],
                  affectedCommands,
                };
              })
            );
          }),
          switchMap(({ otherGames, affectedCommands }) => [
            updateGameCommands({
              game,
              batch: affectedCommands.map(({ extension, command }) => ({
                command,
                oldExtension: extension,
                newExtension: extension,
              })),
            }),
            ...otherGames.map((otherGame) =>
              renameGameEnum({
                game: otherGame,
                newEnumName,
                oldEnumName,
              })
            ),
          ])
        )
      )
    )
  );

  validateExtensions$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(loadExtensionsSuccess),
        tap(({ extensions }) => {
          extensions.forEach((extension) =>
            extension.commands.forEach((command) => {
              if (doesCommandHaveAnyAttributeInvalid(command)) {
                console.warn(
                  `Invalid combination of attributes: extension ${extension.name}, opcode: ${command.id}`
                );
              }
            })
          );
        })
      ),
    { dispatch: false }
  );

  initSupportInfo$ = createEffect(() =>
    this._actions$.pipe(
      ofType(loadExtensionsSuccess),
      withLatestFrom(this._extensions.hasAnyLoadingInProgress$),
      filter(([_, hasAnyLoadingInProgress]) => !hasAnyLoadingInProgress),
      map(() => initSupportInfo())
    )
  );

  cloneCommand$ = createEffect(() =>
    this._actions$.pipe(
      ofType(cloneCommand),
      tap(({ game, command, extension }) => {
        this._router.navigate(['/', game, extension, command.id]);
      }),
      switchMap(({ game, command, extension }) => [
        updateGameCommands({
          game,
          batch: [
            { command, newExtension: extension, oldExtension: extension },
          ],
        }),
        initSupportInfo(),
      ])
    )
  );

  constructor(
    private _actions$: Actions,
    private _extensions: ExtensionsFacade,
    private _changes: ChangesFacade,
    private _auth: AuthFacade,
    private _service: ExtensionsService,
    private _game: GameFacade,
    private _router: Router
  ) {}
}

// if return false then only current game will be updated
function shouldUpdateOtherGames(
  command: Command,
  oldCommand?: Command
): boolean {
  if (!oldCommand) {
    return false;
  }

  if (command.name !== oldCommand.name) {
    return false;
  }
  if (command.num_params !== oldCommand.num_params) {
    return false;
  }

  const attrs = command.attrs || {};
  const oldAttrs = oldCommand.attrs || {};

  if (attrs.is_unsupported !== oldAttrs.is_unsupported) {
    return false;
  }
  if (attrs.is_nop !== oldAttrs.is_nop) {
    return false;
  }

  return true;
}

function bumpVersion(version?: string): string {
  if (!version) {
    return '0.1';
  }
  const parts = version.split('.');
  const last = parts.pop() ?? '0';
  return [...parts, isNaN(+last) ? 0 : +last + 1].join('.');
}
