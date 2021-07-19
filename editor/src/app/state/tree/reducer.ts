import { createReducer, on } from '@ngrx/store';
import { fromPairs, toPairs } from 'lodash';
import { TreeNode, TreeNodeId } from '../../models/tree';
import { state } from '../game/selectors';
import { back, loadStatements, next, restart } from './actions';

export interface TreeState {
  tree: {
    nodes: Record<TreeNodeId, TreeNode>;
  };
  dictionary: Record<string, string>;
  currentId: TreeNodeId;
  history: TreeNodeId[];
  historyLine: string[];
}

// prettier-ignore
const STATEMENTS: Record<string, Record<string, string>> = {
  en: {
    '0053': 'I want to create | a player',
    '00A5': 'I want to create | a vehicle',
    '009A': 'I want to create | a character | standing on foot',
    '0129': 'I want to create | a character | sitting in the car as   | a driver',
    '01C8': 'I want to create | a character | sitting in the car as   | a passenger',
    '0001': 'I have           | a script    | and I want to pause it',
    '004E': 'I have           | a script    | and I want to end it',
    '0050': 'I have           | a script    | and I want to call a subroutine',
    '0051': 'I have           | a script    | and I want to return from the current subroutine',
    '0118': 'I have           | car         | and I want to check     | if it is still alive',
    '0119': 'I have           | character   | and I want to check     | if they are still alive',
    '0256': 'I have           | player      | and I want to check     | if they are still alive',
    '010A': 'I have           | player      | and I want to check     | their money amount',
  },
  ru: {
    '0053': 'Я хочу создать | игрока',
    '00A5': 'Я хочу создать | машину',
    '009A': 'Я хочу создать | персонажа  | , который стоит на ногах',
    '0129': 'Я хочу создать | персонажа  | , который сидит в машине    | , как водитель',
    '01C8': 'Я хочу создать | персонажа  | , который сидит в машине    | , как пассажир',
    '0001': 'У меня есть    | скрипт    | , и я хочу приостановить его',
    '004E': 'У меня есть    | скрипт    | , и я хочу завершить его',
    '0050': 'У меня есть    | скрипт    | , и я хочу вызвать подпрограмму',
    '0051': 'У меня есть    | скрипт    | , и я хочу выйти из текущей подпрограммы',
    '0118': 'У меня есть    | персонаж  | , и я хочу проверить        | , что он еще жив',
    '0119': 'У меня есть    | машина    | , и я хочу проверить        | , что она еще цела',
    '0256': 'У меня есть    | игрок     | , и я хочу проверить        | , что он еще жив',
    '010A': 'У меня есть    | игрок     | , и я хочу проверить        | кол-во денег на счету',
  },
};

export const initialState: TreeState = {
  tree: { nodes: {} },
  dictionary: {},
  currentId: 'root',
  history: [],
  historyLine: [''],
};

export const treeReducer = createReducer(
  initialState,
  on(loadStatements, (state, { lang }) => {
    const { dictionary, lines } = parseStatements(STATEMENTS[lang] || []);

    const nodes = normalizeTree(generateTree(lines));
    return {
      ...state,
      tree: { nodes },
      dictionary,
    };
  }),
  on(next, (state, { id, lineChunk }) => ({
    ...state,
    currentId: id,
    history: [...state.history, state.currentId],
    historyLine: [...state.historyLine, lineChunk],
  })),
  on(back, (state) => {
    const newHistory = [...state.history];
    const prev = newHistory.pop();
    if (!prev) {
      return state;
    }
    return {
      ...state,
      currentId: prev,
      history: newHistory,
      historyLine: state.historyLine.slice(0, -1),
    };
  }),
  on(restart, (state) => ({
    ...state,
    history: [],
    historyLine: [''],
    currentId: 'root',
  }))
);

function parseStatements(statements: Record<string, string>) {
  const entries = Object.entries(statements);

  const dict: string[] = [];

  const getOrInsert = (chunk: string) => {
    const i = dict.findIndex((c) => c === chunk);
    if (i === -1) {
      return (dict.push(chunk) - 1).toString();
    }
    return i.toString();
  };

  const lines = entries.map(([k, v]) => {
    const chunks = v.split('|').map((p) => p.trim());

    return [k, ...chunks.map(getOrInsert)].join(',');
  });

  return {
    lines,
    dictionary: fromPairs(toPairs(dict)),
  };
}

function generateTree(lines: string[]) {
  const tree: Record<string, string[]> = {};
  const queue: Array<[string, number]> = [['root', 1]];
  const uniqBuckets = new Set();
  const valuesList = lines.map((line) => line.split(','));
  const buckets = getBuckets(valuesList);

  const enqueue = (name: string, column: number) => {
    if (uniqBuckets.has(name)) {
      return;
    }
    uniqBuckets.add(name);
    queue.push([name, column]);
  };

  while (queue.length > 0) {
    const [bucketName, column] = queue.pop()!;
    const bucket = new Set<string>();

    for (const values of valuesList) {
      if (bucketName !== 'root' && values[column - 1] !== bucketName) {
        continue;
      }

      const id = values[0];
      if (column >= values.length) {
        bucket.add(id);
        continue;
      }
      const value = values[column];

      const numBuckets = Object.keys(buckets[value]).length;
      if (numBuckets < 2) {
        // no intermediate nodes needed
        if (column === values.length - 1) {
          // terminal node
          bucket.add(`${value}:${id}`);
        } else {
          // next node
          bucket.add(value);
          enqueue(value, column + 1);
        }
      } else {
        if (buckets[value][bucketName] === 1) {
          // aliased node
          const nextRef = values[column + 1];
          bucket.add(`${value}:${nextRef}`);
          enqueue(nextRef, column + 2);
        } else {
          // proxy node
          const newBucketName = `80000${bucketName}`;
          bucket.add(`${value}:${newBucketName}`);

          buckets[newBucketName] ??= {};
          values.splice(column + 1, 0, newBucketName);
          enqueue(newBucketName, column + 2);
        }
      }
    }

    tree[bucketName] = [...bucket].sort();
  }

  return tree;
}

function getBuckets(valuesList: string[][]) {
  const buckets: Record<string, Record<string, number>> = {};

  for (const values of valuesList) {
    for (let index = 1; index < values.length; index++) {
      const bucket = index === 1 ? 'root' : values[index - 1];
      buckets[values[index]] ??= {};
      buckets[values[index]][bucket] ??= 0;
      buckets[values[index]][bucket]++;
    }
  }
  return buckets;
}

function normalizeTree(
  nodes: Record<string, string[]>
): Record<TreeNodeId, TreeNode> {
  return Object.entries(nodes).reduce((m, [key, node]) => {
    node.forEach((id, i) => {
      if (id.includes(':')) {
        const parts = id.split(':');
        const newId = parts.join('_');
        m[newId] = { id: newId, label: parts[0], next: [parts[1]] };
        node[i] = newId;
      }
    });
    m[key] = { id: key, next: node, label: key, proxy: key.length > 5 };
    return m;
  }, {} as Record<TreeNodeId, TreeNode>);
}

// console.log(parseStatements(STATEMENTS));
