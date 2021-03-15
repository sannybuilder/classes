import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { KoreFile } from '../../korefile';
import { Extension, Game } from '../../models';
import {
  clearChanges,
  initializeGithub,
  registerExtensionsChange,
  registerSnippetChange,
  submitChanges,
} from './actions';
import * as selector from './selectors';

@Injectable({ providedIn: 'root' })
export class ChangesFacade {
  changesCount$ = this.store$.select(selector.changesCount);
  lastUpdate$ = this.store$.select(selector.lastUpdate);
  changes$ = this.store$.select(selector.changes);
  github$ = this.store$.select(selector.github).pipe(filter<KoreFile>(Boolean));

  constructor(private store$: Store) {}

  registerExtensionsChange(extensions: Extension[], game: Game) {
    this.store$.dispatch(registerExtensionsChange({ extensions, game }));
  }

  registerSnippetChange() {
    this.store$.dispatch(registerSnippetChange());
  }

  clearChanges() {
    this.store$.dispatch(clearChanges());
  }

  submitChanges() {
    this.store$.dispatch(submitChanges());
  }

  initializeGithub(accessToken: string) {
    this.store$.dispatch(initializeGithub({ accessToken }));
  }
}