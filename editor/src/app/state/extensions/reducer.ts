import { Action, createReducer, on } from '@ngrx/store';
import { Extension, Game } from '../../models';
import {
  loadExtensions,
  loadExtensionsSuccess,
  toggleExtension,
  updateGameCommand,
} from './actions';
import { without, sortBy } from 'lodash';

export interface GameState {
  extensions: Extension[];
  selectedExtensions?: string[];
  loading: boolean;
  entities?: Record<string, string[]>;
}
export interface ExtensionsState {
  games: Partial<Record<Game, GameState>>;
}

export const initialState: ExtensionsState = {
  games: {},
};

const _reducer = createReducer(
  initialState,
  on(loadExtensions, (state, { game }) =>
    updateState(state, game, {
      loading: true,
    })
  ),
  on(loadExtensionsSuccess, (state, { game, extensions }) =>
    updateState(state, game, {
      extensions,
      selectedExtensions: extensions.map((e) => e.name),
      entities: getEntities(extensions),
    })
  ),
  on(
    updateGameCommand,
    (
      state,
      { game, command: newCommand, newExtension: name, oldExtension }
    ) => {
      const gameState: GameState = state.games[game] ?? {
        extensions: [],
        selectedExtensions: [],
        loading: false,
        entities: {},
      };
      let tickExtension: string | null = null;
      let untickExtension: string | null = null;
      let extensions = upsertBy(
        gameState.extensions,
        'name',
        name,
        (e) => ({
          ...e,
          commands: upsertBy(
            e.commands,
            'id',
            newCommand.id,
            () => newCommand,
            () => newCommand
          ),
        }),
        () => {
          tickExtension = name;
          return {
            name,
            commands: [newCommand],
          };
        }
      );

      if (name !== oldExtension) {
        // remove from previous collection
        extensions = upsertBy(extensions, 'name', oldExtension, (e) => {
          const commands = upsertBy(e.commands, 'id', newCommand.id);
          if (!commands.length) {
            // remove previous collection if it is empty
            untickExtension = oldExtension;
            return null;
          }
          return {
            ...e,
            commands,
          };
        });
      }

      const selectedExtensions =
        untickExtension !== null
          ? gameState.selectedExtensions.filter((s) => s !== untickExtension)
          : [...gameState.selectedExtensions];

      if (tickExtension !== null) {
        selectedExtensions.push(tickExtension);
        selectedExtensions.sort();
      }

      const entities = getEntities(extensions);

      return updateState(state, game, {
        extensions,
        selectedExtensions,
        entities,
      });
    }
  ),
  on(toggleExtension, (state, { game, extension }) => {
    const selectedExtensions = state.games[game]?.selectedExtensions ?? [];

    return updateState(state, game, {
      selectedExtensions: selectedExtensions.includes(extension)
        ? without(selectedExtensions, extension)
        : [...selectedExtensions, extension],
    });
  })
);

function updateState(
  state: ExtensionsState,
  game: Game,
  newState: Partial<GameState>
) {
  return {
    ...state,
    games: {
      ...state.games,
      [game]: { ...(state.games[game] ?? {}), ...newState },
    },
  };
}

export function extensionsReducer(state: ExtensionsState, action: Action) {
  return _reducer(state, action);
}

function upsertBy<T extends object, Key extends keyof T>(
  collection: T[],
  key: Key,
  needle: T[Key],
  onFound: (element: T) => T | null = () => null,
  onDefault: () => T | null = () => null
): T[] {
  let found = false;
  const newCollection: T[] = [];

  for (const item of collection) {
    if (item[key] === needle) {
      found = true;
      const newItem = onFound(item);
      if (newItem !== null) {
        newCollection.push(onFound(item));
      }
    } else {
      newCollection.push(item);
    }
  }
  if (!found) {
    const newItem = onDefault();
    if (newItem !== null) {
      newCollection.push(newItem);
      return sortBy(newCollection, key);
    }
  }

  return newCollection;
}

function getEntities(extensions: Extension[]): Record<string, string[]> {
  return extensions.reduce((m, e) => {
    const set = e.commands
      .filter((command) => command.attrs?.is_constructor)
      .reduce((entities, command) => {
        const last = command.output[command.output.length - 1];
        if (!last) {
          return [];
        }
        entities.add(last.type);
        return entities;
      }, new Set());

    (m[e.name] ??= []).push(...set);
    return m;
  }, {} as Record<string, string[]>);
}