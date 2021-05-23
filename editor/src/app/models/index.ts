export interface Attr {
  is_branch: boolean;
  is_segment: boolean;
  is_keyword: boolean;
  is_condition: boolean;
  is_nop: boolean;
  is_unsupported: boolean;
  is_constructor: boolean;
  is_destructor: boolean;
  is_static: boolean;
  is_overload: boolean;
  is_variadic: boolean;
}

export type Attribute = keyof Attr;

export enum PrimitiveType {
  any = 'any',
  arguments = 'arguments',
  boolean = 'bool',
  float = 'float',
  int = 'int',
  label = 'label',
  string = 'string',
  string128 = 'string128',
  gxt_key = 'gxt_key',
  zone_key = 'zone_key',
  model_any = 'model_any',
  model_ide = 'model_ide',
  int_script_id = 'script_id',
}

export enum SourceType {
  any = 'any',
  var_any = 'var_any',
  var_global = 'var_global',
  var_local = 'var_local',
  literal = 'literal',
}

export const CommandAttributes: Attribute[] = [
  'is_branch',
  'is_condition',
  'is_constructor',
  'is_destructor',
  'is_keyword',
  'is_nop',
  'is_overload',
  'is_segment',
  'is_static',
  'is_unsupported',
  'is_variadic',
];

export interface Param {
  type: ParamType['name'];
  name: string;
  source: SourceType;
}

export interface Command {
  id: string;
  name?: string; // can be undefined in delete flow
  attrs?: Partial<Attr>;
  num_params: number;
  input?: Param[];
  output?: Param[];
  class?: string;
  member?: string;
  short_desc?: string;
}

export interface Extension {
  name: string;
  commands: Command[];
}

export interface ExtensionSnippets {
  [extensionName: string]: { [opcode: string]: string };
}

export interface Enums {
  [enumName: string]: Record<string, string | number | null>;
}

export interface EnumRaw {
  name: string;
  fields: Array<[string, string | number | null]>;
  isNew: boolean;
}

export interface Classes {
  classes: ClassRaw[];
}

export interface ClassRaw {
  name: string;
  description: string;
}

export const KNOWN_LANGUAGES = ['en', 'ru', 'cn'];

export enum Game {
  GTA3 = 'gta3',
  VC = 'vc',
  SA = 'sa',
}

export const GameIcon: Record<Game, string> = {
  [Game.GTA3]: 'assets/gta3.png',
  [Game.VC]: 'assets/vc.png',
  [Game.SA]: 'assets/sa.png',
};

export const GameClassesAssets: Record<Game, string> = {
  [Game.GTA3]: 'assets/gta3/classes.db',
  [Game.VC]: 'assets/vc/classes.db',
  [Game.SA]: 'assets/sa/classes.db',
};

export const GameEnumsAssets: Record<Game, string> = {
  [Game.GTA3]: 'assets/gta3/enums.txt',
  [Game.VC]: 'assets/vc/enums.txt',
  [Game.SA]: 'assets/sa/enums.txt',
};

export const GameLibrary: Record<Game, string> = {
  [Game.GTA3]: 'gta3/gta3.json',
  [Game.VC]: 'vc/vc.json',
  [Game.SA]: 'sa/sa.json',
};

export const GameSnippets: Record<Game, string> = {
  [Game.GTA3]: 'gta3/snippets.json',
  [Game.VC]: 'vc/snippets.json',
  [Game.SA]: 'sa/snippets.json',
};

export const GameEnums: Record<Game, string> = {
  [Game.GTA3]: 'gta3/enums.json',
  [Game.VC]: 'vc/enums.json',
  [Game.SA]: 'sa/enums.json',
};

export const GameClasses: Record<Game, string> = {
  [Game.GTA3]: 'gta3/classes.json',
  [Game.VC]: 'vc/classes.json',
  [Game.SA]: 'sa/classes.json',
};

export const GameTitle: Record<Game, string> = {
  [Game.GTA3]: 'GTA III',
  [Game.VC]: 'Vice City',
  [Game.SA]: 'San Andreas',
};

export const DEFAULT_EXTENSION = 'default';

export enum ViewMode {
  None = 'None',
  EditCommand = 'EditCommand',
  ViewCommand = 'ViewCommand',
  ViewClass = 'ViewClass',
  EditClass = 'EditClass',
  ViewEnum = 'ViewEnum',
  EditEnum = 'EditEnum',
  ViewAllClasses = 'ViewAllClasses',
  ViewAllEnums = 'ViewAllEnums',
}

export type Modifier = 'except' | 'only';

export type SupportInfo = Record<string, Record<string, GameSupportInfo[]>>;

export interface GameSupportInfo {
  game: Game;
  level: SupportLevel;
}

export enum SupportLevel {
  DoesNotExist = -2,
  Unsupported = -1,
  Nop = 0,
  Supported = 1,
  SupportedDiffParams = 2,
}

export interface Entity {
  type: 'static' | 'dynamic'; // dynamic can be constructed using an opcode
  name: string;
}

export interface Primitive {
  type: 'primitive';
  name: PrimitiveType;
}

export interface Enum {
  type: 'enum';
  name: string;
}

export type ParamType = Entity | Primitive | Enum;

export interface LoadExtensionsResponse {
  meta: {
    last_update: number;
  };
  extensions: Extension[];
}
