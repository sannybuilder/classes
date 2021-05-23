import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { Config, CONFIG } from '../../config';
import {
  Attribute,
  Command,
  EnumRaw,
  Game,
  Modifier,
  ViewMode,
} from '../../models';
import { AuthFacade } from '../auth/facade';
import {
  updateSearchTerm,
  toggleCommandListElements,
  toggleAttribute,
  displayOrEditCommandInfo,
  stopEditOrDisplay,
  changePage,
  scrollTop,
  resetFilters,
  selectClass,
  selectExtensions,
  displayOrEditEnum,
  toggleInlineMethodDescription,
} from './actions';
import * as selector from './selectors';

@Injectable({ providedIn: 'root' })
export class UiFacade {
  canEdit$ = this._auth.isAuthorized$.pipe(
    map(
      (isAuthorized) =>
        !this._config.features.shouldBeAuthorizedToEdit || isAuthorized
    )
  );
  searchTerm$ = this.store$.select(selector.searchTerm);
  displaySearchBar$ = this.store$.select(selector.displaySearchBar);
  displayLastUpdated$ = this.store$.select(selector.displayLastUpdated);
  displayInlineMethodDescription$ = this.store$.select(
    selector.displayInlineMethodDescription
  );
  selectedExtensions$ = this.store$.select(selector.selectedExtensions);
  currentPage$ = this.store$.select(selector.currentPage);
  commandToDisplayOrEdit$ = this.store$.select(selector.commandToDisplayOrEdit);
  extensionToDisplayOrEdit$ = this.store$.select(
    selector.extensionToDisplayOrEdit
  );
  enumToDisplayOrEdit$ = this.store$.select(selector.enumToDisplayOrEdit);
  viewMode$ = this.store$.select(selector.viewMode);
  snippetToDisplayOrEdit$ = this.store$.select(selector.snippetToDisplayOrEdit);
  rows$ = this.store$.select(selector.rows);

  classToDisplayOrEdit$ = this.store$.select(selector.classToDisplayOrEdit);
  classToDisplayCommands$ = this.store$.select(selector.classToDisplayCommands);

  getAttributeCheckedState(attribute: Attribute, modifier: Modifier) {
    return this.store$.select(
      modifier === 'only'
        ? selector.isAttributeSelectedOnly
        : selector.isAttributeSelectedExcept,
      { attribute }
    );
  }

  getExtensionCheckedState(extension: string) {
    return this.store$.select(selector.isExtensionSelected, {
      extension,
    });
  }

  getClassCheckedState(className: string) {
    return this.store$.select(selector.isClassSelected, {
      className,
    });
  }

  constructor(
    private store$: Store,
    private _auth: AuthFacade,
    @Inject(CONFIG) private _config: Config
  ) {}

  toggleAttribute(attribute: Attribute, modifier: Modifier) {
    this.store$.dispatch(toggleAttribute({ attribute, modifier }));
  }

  updateSearch(term: string) {
    this.store$.dispatch(updateSearchTerm({ term }));
  }

  toggleCommandListElements(flag: boolean) {
    this.store$.dispatch(toggleCommandListElements({ flag }));
  }

  toggleInlineMethodDescription() {
    this.store$.dispatch(toggleInlineMethodDescription());
  }

  displayCommandInfo(command: Command, extension: string) {
    this.store$.dispatch(
      displayOrEditCommandInfo({
        command,
        extension,
        viewMode: ViewMode.ViewCommand,
      })
    );
  }

  editCommandInfo(command: Command, extension: string) {
    this.store$.dispatch(
      displayOrEditCommandInfo({
        command,
        extension,
        viewMode: ViewMode.EditCommand,
      })
    );
  }

  editEnum(enumToEdit: EnumRaw) {
    this.store$.dispatch(
      displayOrEditEnum({ enumToEdit, viewMode: ViewMode.EditEnum })
    );
  }

  stopEditOrDisplay() {
    this.store$.dispatch(stopEditOrDisplay());
  }

  changePage(index: number) {
    this.store$.dispatch(changePage({ index }));
  }

  scrollTop() {
    this.store$.dispatch(scrollTop());
  }

  resetFilters() {
    this.store$.dispatch(resetFilters());
  }

  selectExtensions(game: Game, extensions: string[], state: boolean) {
    this.store$.dispatch(selectExtensions({ game, extensions, state }));
  }

  selectClass(game: Game, className: string, state: boolean) {
    this.store$.dispatch(selectClass({ game, className, state }));
  }
}
