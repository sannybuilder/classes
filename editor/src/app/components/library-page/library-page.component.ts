import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { cloneDeep, isEqual, omit } from 'lodash';

import { CONFIG, Config } from '../../config';
import { Command, Game, ViewMode } from '../../models';
import {
  AuthFacade,
  ExtensionsFacade,
  SnippetsFacade,
  UiFacade,
} from '../../state';
import { FUSEJS_OPTIONS } from '../../fusejs';
import { GameFacade } from 'src/app/state/game/facade';

@Component({
  selector: 'scl-library-page',
  templateUrl: './library-page.component.html',
  styleUrls: ['./library-page.component.scss'],
})
export class LibraryPageComponent implements OnInit, OnDestroy, AfterViewInit {
  ViewMode = ViewMode;
  onDestroy$ = new Subject();
  snippet$ = this._ui.snippetToDisplayOrEdit$;
  extensionNames$ = this._extensions.extensionNames$;
  game$ = this._game.game$;
  canEdit$ = this._auth.isAuthorized$.pipe(
    map(
      (isAuthorized) =>
        !this._config.features.shouldBeAuthorizedToEdit || isAuthorized
    )
  );

  command?: Command;
  oldCommand?: Command;
  snippet?: string;
  oldSnippet?: string;
  extension?: string;
  oldExtension?: string;
  screenSize: number;
  viewMode: ViewMode = ViewMode.None;
  commands?: Command[];
  editorHasError = false;

  constructor(
    private _extensions: ExtensionsFacade,
    private _auth: AuthFacade,
    private _ui: UiFacade,
    private _snippets: SnippetsFacade,
    private _game: GameFacade,
    @Inject(CONFIG) private _config: Config
  ) {}

  ngOnInit() {
    [Game.GTA3, Game.VC, Game.SA].forEach((game) => {
      this._extensions.loadExtensions(game);
      this._snippets.loadSnippets(game);
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
    this._ui.toggleCommandListElements(false);
  }

  ngAfterViewInit(): void {
    this.detectScreenSize();
    this._ui.toggleCommandListElements(true);

    this.snippet$.pipe(takeUntil(this.onDestroy$)).subscribe((snippet) => {
      this.snippet = snippet;
      this.oldSnippet = snippet;
    });

    combineLatest([
      this._ui.commandToDisplayOrEdit$,
      this._ui.extensionToDisplayOrEdit$,
      this._ui.viewMode$,
    ])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(([command, extension, viewMode]) => {
        this.command = command
          ? { input: [], output: [], ...cloneDeep(command) }
          : command;
        this.oldCommand = cloneDeep(this.command);
        this.oldExtension = extension;
        this.extension = extension;
        this.viewMode = viewMode;
      });
  }

  onSave() {
    this._extensions.updateCommand({
      newExtension: this.extension,
      oldExtension: this.oldExtension,
      command: omit(this.command, FUSEJS_OPTIONS.fusejsHighlightKey) as Command,
    });
    if (this.snippet !== this.oldSnippet) {
      this._snippets.updateSnippet({
        extension: this.extension,
        command: this.command,
        content: this.snippet,
      });
    }

    this._ui.stopEditOrDisplay();
  }

  onView(command: Command, extension: string) {
    this._ui.displayCommandInfo(command, extension);
    return false;
  }

  onEdit(command: Command, extension: string) {
    this._ui.editCommandInfo(command, extension);
    return false;
  }

  onCancel() {
    this._ui.stopEditOrDisplay();
  }

  getSnippet(extension: string, opcode: string) {
    return this._snippets.getSnippet(extension, opcode);
  }

  getExtensionEntities(extension: string) {
    return this._extensions.getExtensionEntities(extension);
  }

  getExtensionCommands(extension: string) {
    return this._extensions.getExtensionCommands(extension);
  }

  @HostListener('window:resize', [])
  private detectScreenSize() {
    this.screenSize = window.innerWidth;
  }

  shouldDisableSaveButton() {
    return (
      this.editorHasError ||
      this.noChanges() ||
      // class & member should be both empty or both filed
      !!this.command?.class !== !!this.command.member
    );
  }

  resetChanges() {
    this.onEdit(this.oldCommand, this.oldExtension);
    this.snippet = this.oldSnippet;
    return false;
  }

  noChanges(): boolean {
    return (
      isEqual(this.command, this.oldCommand) &&
      this.extension === this.oldExtension &&
      this.snippet === this.oldSnippet
    );
  }

  getCommandSupportInfo(command: Command, extension: string) {
    return this._game.getCommandSupportInfo(command, extension);
  }
}
