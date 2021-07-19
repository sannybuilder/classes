import { createAction, props } from '@ngrx/store';
import { TreeNodeId } from '../../models/tree';

export const next = createAction(
  '[tree] next node',
  props<{ id: TreeNodeId; lineChunk: string }>()
);

export const back = createAction('[tree] go back to previous choice');

export const restart = createAction('[tree] restart');

export const loadStatements = createAction(
  '[tree] load statements',
  props<{ lang: string }>()
);

export const loadStatementsSuccess = createAction(
  '[tree] load statements success',
  props<{ dictionary: Record<string, string[]> }>()
);
