import { createReducer, on } from '@ngrx/store';
import { smash } from '../../utils';
import { Classes, Game } from '../../models';
import { loadClassesSuccess } from './actions';

export interface ClassesState {
  classes: Partial<Record<Game, Classes>>;
}

export const initialState: ClassesState = {
  classes: {},
};

export const classesReducer = createReducer(
  initialState,
  on(loadClassesSuccess, (state, { game, classes }) =>
    updateState(state, game, classes)
  )
);

function updateState(
  state: ClassesState,
  game: Game,
  newState: Partial<Classes>
) {
  return {
    ...state,
    classes: {
      ...state.classes,
      [game]: smash({ ...(state.classes[game] ?? {}), ...newState }),
    },
  };
}
