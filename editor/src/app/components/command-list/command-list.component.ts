import { Component, ViewChild, OnInit, Inject, OnDestroy } from '@angular/core';
import { ReplaySubject, Subject, timer } from 'rxjs';
import { debounce, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { omit } from 'lodash';

import { CONFIG, Config } from '../../config';
import { Command, Game } from '../../models';
import { StateFacade } from '../../state/facade';
import {
  CommandEditorComponent,
  SaveEvent,
} from '../command-editor/command-editor.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CommandInfoComponent } from '../command-info/command-info.component';

@Component({
  selector: 'scl-command-list',
  templateUrl: './command-list.component.html',
  styleUrls: ['./command-list.component.scss'],
})
export class CommandListComponent implements OnInit, OnDestroy {
  @ViewChild(CommandEditorComponent) commandEditor: CommandEditorComponent;
  @ViewChild(CommandInfoComponent) commandInfo: CommandInfoComponent;
  rows: Command[] = [];
  onDestroy$ = new Subject();

  extensions$ = this.facade.extensions$;
  extensionNames$ = this.extensions$.pipe(
    map((extensions) => extensions.map((e) => e.name))
  );
  editCommand$ = this.facade.editCommand$;
  loading$ = this.facade.loading$;

  searchTerms: string;
  searchTerm$ = this.facade.searchTerm$;
  searchTermDebounce$ = this.searchTerm$.pipe(debounce(() => timer(500)));
  exactSearch: boolean = false;
  title: string;
  game: Game;

  displayOpcodeInfoOnDemand$ = new ReplaySubject<{
    opcode: string;
    extension: string;
  }>(1);

  displayOpcodeInfo$ = this.extensions$
    .pipe(
      takeUntil(this.onDestroy$),
      switchMap((extensions) =>
        this.displayOpcodeInfoOnDemand$.pipe(
          map(({ opcode, extension }) => {
            return extensions
              .find((e) => e.name === extension)
              ?.commands.find((command) => command.id === opcode);
          }),
          filter<Command>(Boolean)
        )
      )
    )
    .subscribe((command) => {
      this.commandInfo.open(command);
    });

  searchOptions = {
    keys: ['name', 'short_desc', 'id'],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 3,
    distance: 50,
    fusejsHighlightKey: '_highlight',
  };

  constructor(
    public facade: StateFacade,
    @Inject(CONFIG) public config: Config,
    public route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit() {
    this._router.events
      .pipe(
        filter((x) => x instanceof NavigationEnd),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.onRouteChange();
      });

    this.onRouteChange();
    this.facade.toggleCommandListElements(true);
  }

  onRouteChange() {
    const { data } = this.route.snapshot.data;
    this.title = data.title;
    if (data.game !== this.game) {
      this.game = data.game;
      this.facade.loadExtensions(this.game);
    }
    if (data.opcode && data.extension) {
      this.displayInfo(data.opcode, data.extension);
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
    this.facade.toggleCommandListElements(false);
  }

  edit(command: Command, extension: string, availableExtensions: string[]) {
    this.facade.editCommand(command);
    this.commandEditor.open(command, extension, availableExtensions);
    return false;
  }

  onSave({ command, newExtension, oldExtension }: SaveEvent) {
    this.facade.updateCommand({
      newExtension,
      oldExtension,
      command: omit(command, this.searchOptions.fusejsHighlightKey),
      game: this.game,
    });
  }

  toggleExtension(extenstion: string) {
    this.facade.toggleExtension(extenstion);
  }

  isExtensionChecked(extension: string) {
    return this.facade.getExtensionCheckedState(extension);
  }

  displayInfo(opcode: string, extension: string) {
    this.displayOpcodeInfoOnDemand$.next({ opcode, extension });
  }
}