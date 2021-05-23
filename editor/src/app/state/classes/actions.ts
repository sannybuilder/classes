import { createAction, props } from '@ngrx/store';
import { Classes, Game } from '../../models';

export const loadClasses = createAction(
  '[classes] load',
  props<{ game: Game }>()
);

export const loadClassesSuccess = createAction(
  '[classes] load success',
  props<{ game: Game; classes: Classes }>()
);
