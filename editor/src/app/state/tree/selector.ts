import { createFeatureSelector, createSelector } from '@ngrx/store';
import { flatMap } from 'lodash';
import { isThisNodeTerminal } from '../../utils';
import { TreeNode, TreeNodeId } from '../../models/tree';
import { TreeState } from './reducer';

export const state = createFeatureSelector<TreeState>('tree');

export const currentId = createSelector(
  state,
  (state: TreeState) => state.currentId
);

export const currentNode = createSelector(
  state,
  currentId,
  (state: TreeState, nodeId: TreeNodeId) => state.tree.nodes[nodeId]
);

export const nextNodes = createSelector(
  state,
  currentNode,
  (state: TreeState, node: TreeNode) => getNext(state.tree.nodes, node)
);

function getNext(
  nodes: TreeState['tree']['nodes'],
  node: TreeNode
): TreeNode[] {
  return flatMap(node.next, (id) => {
    if (isThisNodeTerminal(node)) {
      return [{ id, opcode: id, next: [] }];
    }

    const next = nodes[id];

    if (!next.proxy) {
      return next;
    }

    return getNext(nodes, next);
  });
}

export const currentLine = createSelector(state, (state) =>
  state.historyLine.join(' ').replace(/ ,/g, ',')
);

export const dictionary = createSelector(state, (state) => state.dictionary);
