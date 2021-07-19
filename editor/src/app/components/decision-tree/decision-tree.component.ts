import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { DEFAULT_EXTENSION, Game } from '../../models';
import { ExtensionsFacade, TreeFacade } from '../../state';
import { TreeNode } from '../../models/tree';
import { isThisNodeTerminal } from '../../utils';

@Component({
  selector: 'scl-decision-tree',
  templateUrl: './decision-tree.component.html',
  styleUrls: ['./decision-tree.component.scss'],
})
export class DecisionTreeComponent {
  @Input() game: Game;
  nextNodes$ = this._facade.nextNodes$;
  currentNode$ = this._facade.currentNode$;
  currentLine$ = this._facade.currentLine$;

  hasReachedTheEnd$ = this.nextNodes$.pipe(
    map((nodes) => nodes.every((node) => node.next.length === 0))
  );

  constructor(
    private _facade: TreeFacade,
    private _extensions: ExtensionsFacade,
    private _router: Router,
    private _translate: TranslateService
  ) {}

  next(node: TreeNode) {
    if (node.opcode) {
      this._router.navigate(['/', this.game], {
        queryParams: { q: node.opcode },
      });
    } else {
      if (!node.id) {
        throw new Error(`Node id is missing ! node: ${node}`);
      }
      const lineChunk = this._translate.instant(['tree', node.label].join('.'));
      this._facade.next(node.id, lineChunk);
    }
    return false;
  }

  getCommand(id: string) {
    return this._extensions.getExtensionCommand({
      id,
      extension: DEFAULT_EXTENSION,
    });
  }

  isThisNodeTerminal(node: TreeNode) {
    return isThisNodeTerminal(node);
  }
}
