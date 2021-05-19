export enum GameActionType {
  NONE = '',
  DECLARE_PLAYER = 'declarePlayer',
  DECLARE_ROUND = 'declareRound',
  DECLARE_TEAM_SIZE = 'declareTeamSize',
  START = 'start',
  DECLARE_ROLE = 'declareRole',
  REVEAL_EVIL = 'revealEvil',
  REVEAL_MERLIN = 'revealMerlin',
  REVEAL_EVIL_EACH = 'revealEvilEach',
  DECLARE_LEADER = 'declareLeader',
  ASSIGN_TEAM = 'assignTeam',
  ASSIGN_TASK = 'assignTask',
  VOTE = 'vote',
  DECLARE_TASK_RESULT = 'declareTaskResult',
  ASSIGN_GOD = 'assignGod',
  ASSIGN_REVEAL_PLAYER = 'assignRevealPlayer',
  REVEAL_PLAYER = 'revealPlayer',
  ASSIGN_GOD_STATEMENT = 'assignGodStatement',
  DECLARE_GOD_STATEMENT = 'declareGodStatement',
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

// export interface GameAction {
//   type: GameActionType;
//   payload?: any;
// }

export type GameAction =
NoneAction |
AssignGodAction |
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
