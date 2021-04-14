import { createAction, props } from '@ngrx/store';
import { Attribute, Command, Game, Modifier, ViewMode } from '../../models';

export const selectExtension = createAction(
  'change extension selection',
  props<{ game: Game; extension: string; state: boolean }>()
);

export const toggleFilter = createAction(
  'toggle filter selection',
  props<{ filter: Attribute; modifier: Modifier }>()
);

export const toggleClass = createAction(
  'toggle class selection',
  props<{ game: Game; className: string }>()
);

export const updateSearchTerm = createAction(
  'update search term',
  props<{ term: string }>()
);

export const toggleCommandListElements = createAction(
  'toggle command list elements',
  props<{ flag: boolean }>()
);

export const displayOrEditCommandInfo = createAction(
  'display or edit command',
  props<{ command: Command; extension: string; viewMode: ViewMode }>()
);

export const displayOrEditSnippet = createAction(
  'display or edit snippet',
  props<{ snippet: string }>()
);

export const stopEditOrDisplay = createAction('stop edit or display');

export const changePage = createAction(
  'change page',
  props<{ index: number | 'all' }>()
);

export const scrollTop = createAction('scroll top');

export const resetFilters = createAction('reset filters');
