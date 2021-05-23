import { createReducer, on } from '@ngrx/store';
import { EnumRaw, Enums, Game } from '../../models';
import { loadEnumsSuccess, renameGameEnum, updateGameEnum } from './actions';
import { fromPairs, mapValues } from 'lodash';
import { evaluateEnumValues, smash } from '../../utils';

export interface EnumsState {
  enums: Partial<Record<Game, Enums>>;
}

export const initialState: EnumsState = {
  enums: {},
};

export const enumsReducer = createReducer(
  initialState,
  on(loadEnumsSuccess, (state, { game, enums }) =>
    updateState(state, game, enums)
  ),
  on(updateGameEnum, (state, { enumToEdit, oldEnumToEdit, game }) => {
    const newState = {
      [oldEnumToEdit.name]: enumToEdit.fields?.length
        ? makeEnum(enumToEdit.fields)
        : undefined,
    };
    return updateState(state, game, newState);
  }),
  on(renameGameEnum, (state, { newEnumName, oldEnumName, game }) => {
    const currentEnum = state.enums[game]?.[oldEnumName];

    if (!currentEnum) {
      return state;
    }
    return updateState(state, game, {
      [oldEnumName]: undefined,
      [newEnumName]: newEnumName ? currentEnum : undefined,
    });
  })
);

function updateState(state: EnumsState, game: Game, newState: Partial<Enums>) {
  return {
    ...state,
    enums: {
      ...state.enums,
      [game]: smash({ ...(state.enums[game] ?? {}), ...newState }),
    },
  };
}

function makeEnum(fields: EnumRaw['fields']) {
  return mapValues(fromPairs(evaluateEnumValues(fields)), (v) => {
    if (v == null || v === '') {
      return null;
    }

    const matches = /^"(.*)"$/.exec(v.toString());
    return matches ? matches[1] : v;
  });
}
