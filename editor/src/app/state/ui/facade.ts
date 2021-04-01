import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { Attribute, Command, Game, Modifier, ViewMode } from '../../models';
import {
  toggleExtension,
  updateSearchTerm,
  toggleCommandListElements,
  toggleFilter,
  displayOrEditCommandInfo,
  stopEditOrDisplay,
  onListEnter,
  changePage,
} from './actions';
import * as selector from './selectors';

@Injectable({ providedIn: 'root' })
export class UiFacade {
  searchTerm$ = this.store$.select(selector.searchTerm);
  displaySearchBar$ = this.store$.select(selector.displaySearchBar);
  displayLastUpdated$ = this.store$.select(selector.displayLastUpdated);
  selectedFiltersOnly$ = this.store$.select(selector.selectedFiltersOnly);
  selectedFiltersExcept$ = this.store$.select(selector.selectedFiltersExcept);
  supportInfo$ = this.store$.select(selector.supportInfo);
  currentPage$ = this.store$.select(selector.currentPage);

  game$ = this.store$
    .select(selector.game)
    .pipe(distinctUntilChanged(), filter<Game>(Boolean));

  commandToDisplayOrEdit$ = this.store$.select(selector.commandToDisplayOrEdit);
  snippetToDisplayOrEdit$ = this.store$.select(selector.snippetToDisplayOrEdit);

  opcodeOnLoad$ = this.store$.select(selector.opcodeOnLoad).pipe(
    distinctUntilChanged(
      (a, b) => a.opcode === b.opcode && a.extension === b.extension
    ),
    filter((a) => !!a.extension)
  );

  getFilterCheckedState(filter: Attribute, modifier: Modifier) {
    return this.store$.select(
      modifier === 'only'
        ? selector.isFilterSelectedOnly
        : selector.isFilterSelectedExcept,
      { filter }
    );
  }

  getCommandSupportInfo(command: Command, extension: string) {
    return this.store$.select(selector.commandSupportInfo, {
      command,
      extension,
    });
  }

  constructor(private store$: Store) {}

  toggleExtension(extension: string) {
    this.store$.dispatch(toggleExtension({ extension }));
  }

  toggleFilter(filter: Attribute, modifier: Modifier) {
    this.store$.dispatch(toggleFilter({ filter, modifier }));
  }

  updateSearch(term: string) {
    this.store$.dispatch(updateSearchTerm({ term }));
  }

  toggleCommandListElements(flag: boolean) {
    this.store$.dispatch(toggleCommandListElements({ flag }));
  }

  displayCommandInfo(command: Command, extension: string) {
    this.store$.dispatch(
      displayOrEditCommandInfo({ command, extension, viewMode: ViewMode.View })
    );
  }

  editCommandInfo(command: Command, extension: string) {
    this.store$.dispatch(
      displayOrEditCommandInfo({ command, extension, viewMode: ViewMode.Edit })
    );
  }

  stopEditOrDisplay() {
    this.store$.dispatch(stopEditOrDisplay());
  }

  onListEnter(game: Game, opcode: string, extension: string) {
    this.store$.dispatch(onListEnter({ game, opcode, extension }));
  }

  changePage(index: number) {
    this.store$.dispatch(changePage({ index }));
  }
}
