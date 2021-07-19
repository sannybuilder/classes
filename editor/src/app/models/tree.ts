export type TreeNodeId = string;

export interface TreeNode {
  id?: TreeNodeId;
  next: TreeNodeId[];
  opcode?: string;
  label?: string;
  proxy?: boolean; // ephemeral node serving as a link to other set of nodes, id starts from 800000
}
