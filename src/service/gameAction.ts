export enum GameActionType {
  NONE = '',
  DECLARE_PLAYER = 'DECLARE_PLAYER',
  DECLARE_ROUND = 'DECLARE_ROUND',
  DECLARE_TEAM_SIZE = 'DECLARE_TEAM_SIZE',
  START = 'START',
  DECLARE_ROLE = 'DECLARE_ROLE',
  REVEAL_EVIL = 'REVEAL_EVIL',
  REVEAL_MERLIN = 'REVEAL_MERLIN',
  REVEAL_EVIL_EACH = 'REVEAL_EVIL_EACH',
  DECLARE_LEADER = 'DECLARE_LEADER',
  ASSIGN_TEAM = 'ASSIGN_TEAM',
  ASSIGN_TASK = 'ASSIGN_TASK',
  VOTE = 'VOTE',
  DECLARE_TASK_RESULT = 'DECLARE_TASK_RESULT',
  ASSIGN_GOD = 'ASSIGN_GOD',
  ASSIGN_REVEAL_PLAYER = 'ASSIGN_REVEAL_PLAYER',
  REVEAL_PLAYER = 'REVEAL_PLAYER',
  ASSIGN_GOD_STATEMENT = 'ASSIGN_GOD_STATEMENT',
  DECLARE_GOD_STATEMENT = 'DECLARE_GOD_STATEMENT',
  DECLARE_TASK_LIST = 'DECLARE_TASK_LIST',
}
export interface VoteResult {
  player: string
  result: boolean;
}
export interface DeclarePalyerAction {
  type: GameActionType.DECLARE_PLAYER;
  payload: string[];
}
export interface DeclareRoundAction {
  type: GameActionType.DECLARE_ROUND;
  payload: number;
}
export interface DeclareTeamSizeAction {
  type: GameActionType.DECLARE_TEAM_SIZE;
  payload: number;
}
export interface DeclareRoleAction {
  type: GameActionType.DECLARE_ROLE;
  payload: string;
}
export interface RevealEvilAction {
  type: GameActionType.REVEAL_EVIL;
  payload: string[];
}
export interface RevealMerlinAction {
  type: GameActionType.REVEAL_MERLIN;
  payload: string[];
}
export interface RevealEvilEachAction {
  type: GameActionType.REVEAL_EVIL_EACH;
  payload: string[];
}
export interface DeclareLeaderAction {
  type: GameActionType.DECLARE_LEADER;
  payload: string;
}
export interface AssignTeamAction {
  type: GameActionType.ASSIGN_TEAM;
  payload: string[];
}
export interface AassignTaskAction {
  type: GameActionType.ASSIGN_TASK;
  payload: string[];
}
export interface voteAction {
  type: GameActionType.VOTE;
  payload: boolean;
}
export interface DeclareTaskResultAction {
  type: GameActionType.DECLARE_TASK_RESULT;
  payload: VoteResult[];
}
export interface GameStartAction {
  type: GameActionType.START;
  payload: null;
}
export interface NoneAction {
  type: GameActionType.NONE;
  payload: null;
}
export interface AssignGodAction {
  type: GameActionType.ASSIGN_GOD;
  payload: string;
}
export interface AssignRevealPlayerAction {
  type: GameActionType.ASSIGN_REVEAL_PLAYER;
  payload: string;
}

export interface RevealPlayer {
  player: string;
  isGood: boolean;
}

export interface RevealPlayerAction {
  type: GameActionType.REVEAL_PLAYER;
  payload: RevealPlayer;
}

export interface GodStatement {
  god: string;
  player: string;
  isGood: boolean;
}

export interface AssignGodStatementAction {
  type: GameActionType.ASSIGN_GOD_STATEMENT;
  payload: GodStatement;
}

export interface DeclareGodStatementAction {
  type: GameActionType.DECLARE_GOD_STATEMENT;
  payload: GodStatement;
}
export interface DeclareTaskListAction {
  type: GameActionType.DECLARE_TASK_LIST;
  payload: boolean[];
}

// export interface GameAction {
//   type: GameActionType;
//   payload?: any;
// }

export type GameAction =
NoneAction |
AssignGodAction |
DeclareTaskListAction |
AssignGodStatementAction |
DeclareGodStatementAction |
AssignRevealPlayerAction |
RevealPlayerAction |
GameStartAction |
DeclarePalyerAction |
DeclareRoundAction |
DeclareTeamSizeAction |
DeclareRoleAction |
RevealEvilAction |
RevealMerlinAction |
RevealEvilEachAction |
AssignTeamAction |
AassignTaskAction |
voteAction |
DeclareTaskResultAction |
DeclareLeaderAction;
