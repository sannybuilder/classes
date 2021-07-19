import { TreeNode } from '../models/tree';

const isOpcodeRef = (id: string) => id.length === 4 && id[0] === '0';

export const isThisNodeTerminal = (node: TreeNode) =>
  node.next.every(isOpcodeRef);
