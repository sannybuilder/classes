import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  Command,
  DEFAULT_EXTENSION,
  Extension,
  Game,
  SupportInfo,
} from '../../models';
import { game } from '../game/selectors';
import { ExtensionsState, GameState } from './reducer';

export const extensionsState =
  createFeatureSelector<ExtensionsState>('extensions');

export const state = createSelector(
  extensionsState,
  game,
  (state: ExtensionsState, game: Game | undefined) =>
    game ? state.games[game] : undefined
);

export const extensions = createSelector(
  state,
  (state: GameState | undefined) => state?.extensions
);

export const entities = createSelector(
  state,
  (state: GameState | undefined) => state?.entities
);

export const gameExtensions = createSelector(
  extensionsState,
  (state: ExtensionsState, props: { game: Game }) =>
    state.games[props.game]?.extensions ?? []
);

export const extensionNames = createSelector(
  extensions,
  (extensions?: Extension[]) =>
    extensions ? extensions.map((e) => e.name) : []
);

export const extensionCommands = createSelector(
  extensions,
  (extensions: Extension[] | undefined, props: { extension: string }) =>
    extensions?.find((e) => e.name === props.extension)?.commands
);

export const extensionCommand = createSelector(
  extensions,
  (
    extensions: Extension[] | undefined,
    props: { extension: string; id: string }
  ) =>
    extensions
      ?.find((e) => e.name === props.extension)
      ?.commands?.find((c) => c.id === props.id)
);

export const loading = createSelector(
  state,
  (state: GameState | undefined) => state?.loading
);

export const extensionEntities = createSelector(
  state,
  (state: GameState | undefined, props: { extension: string }) =>
    state?.entities?.[props.extension] ?? []
);

export const lastUpdate = createSelector(
  state,
  (state: GameState | undefined) => state?.lastUpdate
);

export const supportInfo = createSelector(
  state,
  (state: GameState | undefined) => state?.supportInfo
);

export const commandSupportInfo = createSelector(
  supportInfo,
  (
    supportInfo: SupportInfo | undefined,
    props: { command: Command; extension: string }
  ) => supportInfo?.[props.extension]?.[props.command.id]
);

export const commandRelated = createSelector(
  extensions,
  (
    extensions: Extension[] | undefined,
    props: { extension: string; command: Command }
  ) => {
    const commands = extensions?.find(
      (e) => e.name === props.extension
    )?.commands;
    if (!commands) {
      return;
    }

    const { id, name, class: className, member, attrs } = props.command;
    const referenced = commands.filter((c) => c.short_desc?.includes(id)) ?? [];

    const overloads = attrs?.is_overload
      ? commands.filter((c) => {
          return (
            c.id !== id &&
            (c.name === name || (c.class === className && c.member === member))
          );
        })
      : [];

    return [...referenced, ...overloads];
  }
);

export const hasAnyLoadingInProgress = createSelector(
  extensionsState,
  (state: ExtensionsState) => Object.values(state.games).some((s) => s?.loading)
);

export const gameVersion = createSelector(
  extensionsState,
  (state: ExtensionsState, props: { game: Game }) =>
    state.games[props.game]?.version
);

export const version = createSelector(
  state,
  (state: GameState | undefined) => state?.version
);

export const classOrigin = createSelector(
  extensions,
  (extensions: Extension[] | undefined, props: { className: string }) =>
    extensions?.find((e) => e.commands.some((c) => c.class === props.className))
      ?.name ?? DEFAULT_EXTENSION
);
