import { createAction, props } from '@ngrx/store';
import { Command, Extension, Game } from '../../models';

export interface GameCommandUpdate {
  command: Command;
  newExtension: string;
  oldExtension: string;
}

export const loadExtensions = createAction(
  '[extensions] load',
  props<{ game: Game }>()
);

export const loadExtensionsSuccess = createAction(
  '[extensions] load success',
  props<{ game: Game; extensions: Extension[]; lastUpdate: number }>()
);

export const updateCommands = createAction(
  '[extensions] batch update commands',
  props<{
    batch: GameCommandUpdate[];
  }>()
);

export const updateGameCommands = createAction(
  '[extensions] batch update commands for the given game',
  props<{
    game: Game;
    batch: GameCommandUpdate[];
  }>()
);
