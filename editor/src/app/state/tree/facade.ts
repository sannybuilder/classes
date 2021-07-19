import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { back, next, restart } from './actions';
import { TreeNodeId } from '../../models/tree';
import { currentLine, currentNode, dictionary, nextNodes } from './selector';

@Injectable({ providedIn: 'root' })
export class TreeFacade {
  nextNodes$ = this._store$.select(nextNodes);
  currentNode$ = this._store$.select(currentNode);
  currentLine$ = this._store$.select(currentLine);
  dictionary$ = this._store$.select(dictionary);

  constructor(private _store$: Store) {}

  next(id: TreeNodeId, lineChunk: string) {
    this._store$.dispatch(next({ id, lineChunk }));
  }

  back() {
    this._store$.dispatch(back());
  }

  restart() {
    this._store$.dispatch(restart());
  }
}
