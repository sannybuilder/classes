import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Game } from '../../models';
import { loadClasses } from './actions';
import * as selector from './selectors';

@Injectable({ providedIn: 'root' })
export class ClassesFacade {
  classes$ = this.store$.select(selector.classes);

  constructor(private store$: Store) {}

  loadClasses(game: Game) {
    return this.store$.dispatch(loadClasses({ game }));
  }
}
