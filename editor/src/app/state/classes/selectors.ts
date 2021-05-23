import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Game } from '../../models';
import { game } from '../game/selectors';
import { ClassesState } from './reducer';

export const state = createFeatureSelector<ClassesState>('classes');

export const classes = createSelector(
  state,
  game,
  (state: ClassesState, game: Game | undefined) =>
    game ? state.classes[game] : undefined
);
