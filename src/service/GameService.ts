import WebSocket from 'ws';
import GameRoomModel from '../model/gameRoomModel';
import GameRoleService, { GameRoleName } from './gameRoleService';
import {
  GameAction,
  GodStatement,
  DeclareGodStatementAction,
  AssignGodAction,
  RevealPlayerAction,
  RevealMerlinAction,
  RevealEvilAction,
  RevealEvilEachAction,
  DeclareRoleAction,
  DeclareRoundAction,
  DeclarePalyerAction,
  DeclareTaskResultAction,
  AassignTaskAction,
  DeclareTeamSizeAction,
  DeclareTaskListAction,
  DeclareLeaderAction,
  VoteResult,
  GameActionType,
  DeclareTeamAction,
  DeclareApprovalResultAction,
  DeclareRevealedPlayerListAction,
  DeclareApprovalListAction,
  DeclareUnApprovalCountAction,
  DeclareGameResultAction,
  DeclareAssassinAction,
  DeclareKillResultAction,
  GameResult,
} from './gameAction';

interface Player {
  [key: string]: WebSocket;
}
export interface GameRole {
  [key: string]: GameRoleName;
}

class GameService {
  public host: string = '';

  public roomId: number = 0;

  public webSocketServer: WebSocket.Server;

  public player: Player;

  public playerList: string[] = [];

  private role: GameRole = {};

  private MERLIN: string = '';

  private PERCIVAL: string = '';

  private MORGANA: string = '';

  private ASSASSIN: string = '';

  private OBERON: string = '';

  private MORDRED: string = '';

  private step: number = 0;

  private round: number = 0;

  private teamMemberList: string[] = [];

  private revealedPlayerList: string[] = [];

  private voteResultList: VoteResult[] = [];

  private taskList: boolean[] = [];

  private approvalList: VoteResult[] = [];

  private unApproveCount: number = 0;

  private isMerlinKilled: boolean = false;

  public get playerCount(): number {
    return Object.keys(this.player).length;
  }

  public get leader(): string {
    return this.playerList[this.round - 1];
  }

  private get isVoteFinished(): boolean {
    return this.teamMemberList.length === this.voteResultList.length;
  }

  private get isApproveFinished(): boolean {
    return this.approvalList.length === this.playerCount;
  }

  private get taskResult(): boolean {
    let failCount = 0;

    this.voteResultList.forEach((result) => {
      if (result.result === false) {
        failCount += 1;
      }
    });

    if (this.round === 4) {
      return failCount < 2;
    }

    return failCount === 0;
  }

  private get failCount(): number {
    const failCount = this.taskList.filter((task) => !task).length;
    return failCount;
  }

  private get successCount(): number {
    const successCount = this.taskList.filter((task) => task).length;
    return successCount;
  }

  private get gameResult(): boolean {
    if (this.isMerlinKilled) {
      return false;
    }

    if (this.failCount >= 3) {
      return false;
    }
    return true;
  }

  private get approveResult(): boolean {
    let rejectCount = 0;
    let approveCount = 0;
    this.approvalList.forEach((result) => {
      if (result.result === false) {
        rejectCount += 1;
      } else {
        approveCount += 1;
      }
    });

    return approveCount > rejectCount;
  }

  private get getTeamSize(): number {
    const { round, playerCount } = this;
    if (round === 1) {
      return playerCount < 8 ? 2 : 3;
    }
    if (round === 2) {
      return playerCount < 8 ? 3 : 4;
    }
    if (round === 3 && playerCount === 5) {
      return 2;
    }
    if (round === 3 && playerCount === 7) {
      return 3;
    }
    if (round === 3) {
      return 4;
    }
    if (round === 4 && (playerCount === 5 || playerCount === 6)) {
      return 3;
    }
    if (round === 4 && playerCount === 7) {
      return 4;
    }
    if (round === 4) {
      return 5;
    }
    if (round === 5 && playerCount === 5) {
      return 3;
    }
    if (round === 5 && (playerCount === 6 || playerCount === 7)) {
      return 4;
    }
    if (round === 5) {
      return 5;
    }
    return 0;
  }

  constructor(host: string) {
    this.host = host;
    this.player = {};
    this.webSocketServer = new WebSocket.Server({ noServer: true });
    this.webSocketServer.on('connection', (webSocket: WebSocket, name: string) => {
      this.addPlayer(name, webSocket);
      this.declarePlayer();
      webSocket.on('message', (data: string) => {
        this.handleMessage(data, webSocket);
        console.log(`message from WebSocket Client: ${data}`);
      });
    });
  }

  private async handleMessage(message: string, client: WebSocket): Promise<void> {
    const action: GameAction = GameService.getActionFromMessage(message);
    const player = this.getPlayerByWebSocket(client);
    console.log(action);
    if (action.type === GameActionType.START && this.isHost(client) && this.round === 0) {
      await this.startGame();
      await this.incrementGameStep();
      return;
    }

    if (action.type === GameActionType.ASSIGN_TEAM && this.isLeader(client) && action.payload.length > 0) {
      this.teamMemberList = action.payload;
      await this.incrementGameStep();
      return;
    }

    if (action.type === GameActionType.VOTE && this.isValidVoter(player) && action.payload !== undefined) {
      const voteResult: VoteResult = {
        player,
        result: action.payload,
      };
      this.voteResultList.push(voteResult);
      await this.handleVote();
      return;
    }
    if (action.type === GameActionType.APPROVE && this.isValidApprover(player) && action.payload !== undefined) {
      const voteResult: VoteResult = {
        player,
        result: action.payload,
      };
      this.approvalList.push(voteResult);
      await this.handleApprove();
      return;
    }

    if (action.type === GameActionType.ASSIGN_REVEAL_PLAYER && this.isLeader(client) && !this.isRevealedPlayer(action.payload)) {
      const revealablePlayer = action.payload;
      this.revealedPlayerList.push(revealablePlayer);
      this.declareRevealedPlayerList();
      const playerRole = this.role[revealablePlayer];
      const isGood = GameRoleService.isGood(playerRole);
      const revealAction: RevealPlayerAction = {
        type: GameActionType.REVEAL_PLAYER,
        payload: {
          player: revealablePlayer,
          isGood,
        },
      };
      client.send(JSON.stringify(revealAction));
      return;
    }

    if (action.type === GameActionType.ASSIGN_GOD_STATEMENT && this.isLeader(client) && action.payload) {
      this.declareGodStatement(action.payload);
      await this.resetGameStep();
      return;
    }
    if (action.type === GameActionType.ASSIGN_KILL_PLAYER && this.ASSASSIN === player && action.payload) {
      const killedPlayer = action.payload;
      this.isMerlinKilled = this.MERLIN === killedPlayer;
      this.declareKillResult(this.isMerlinKilled);
      this.handleStep();
      return;
    }

    this.broadcast(`${this.getPlayerByWebSocket(client)}:${message}`);
  }

  private isValidVoter(player: string): boolean {
    if (this.teamMemberList.includes(player) === false) {
      return false;
    }
    const votedPlayers = this.voteResultList.map((item) => item.player);
    return !votedPlayers.includes(player);
  }

  private isValidApprover(player: string): boolean {
    const approvedPlayers = this.approvalList.map((item) => item.player);
    return !approvedPlayers.includes(player);
  }

  static getActionFromMessage(message: string): GameAction {
    try {
      const action: GameAction = JSON.parse(message);

      if (!action.type || typeof action.type !== 'string') {
        throw new Error();
      }
      return action;
    } catch (error) {
      return {
        type: GameActionType.NONE,
        payload: null,
      };
    }
  }

  private broadcast(message: string) {
    Object.values(this.player).forEach((client) => {
      client.send(message);
    });
  }

  private broadcastAction(action: GameAction) {
    Object.values(this.player).forEach((client) => {
      client.send(JSON.stringify(action));
    });
  }

  public playerExist(name: string) {
    return name in this.player;
  }

  public isHost(client: WebSocket): boolean {
    return this.player[this.host] === client;
  }

  public isLeader(client: WebSocket): boolean {
    return this.player[this.leader] === client;
  }

  public isTeamMember(client: WebSocket): boolean {
    return this.teamMemberList.some((player) => this.player[player] === client);
  }

  public isRevealedPlayer(player: string): boolean {
    return this.revealedPlayerList.some((revealedPlayer) => revealedPlayer === player);
  }

  public resetApproveList(): void {
    this.approvalList = [];
  }

  public resetVoteResultList(): void {
    this.voteResultList = [];
  }

  public getPlayerByWebSocket(client: WebSocket): string {
    const players = Object.keys(this.player);
    for (let index = 0; index < players.length; index += 1) {
      const player = players[index];
      if (this.player[player] === client) {
        return player;
      }
    }

    return '';
  }

  private addPlayer(name: string, webSocket: WebSocket): boolean {
    if (name in this.player) {
      return false;
    }
    this.player[name] = webSocket;
    this.playerList.push(name);
    return true;
  }

  private async startGame(): Promise<void> {
    await this.setGameRole();
    this.declareGameRole();
    this.revealGameRole();
  }

  private async resetGameStep(): Promise<void> {
    this.step = 1;
    this.handleStep();
  }

  private async incrementGameStep(): Promise<void> {
    this.step += 1;
    this.handleStep();
  }

  private async handleStep() {
    console.log(`step: ${this.step}`);
    console.log(`round: ${this.round}`);

    if (this.unApproveCount >= 5 || this.failCount >= 3 || this.isMerlinKilled) {
      this.step = 6;
    } else if (this.successCount >= 3) {
      this.step = 5;
    }

    if (this.step === 1) {
      this.incrementRound();
      this.declareTeamSize();
      this.declareLeader();
    } else if (this.step === 2) {
      // 宣告選擇出任務玩家
      this.declareTeam();
    } else if (this.step === 3) {
      // 宣告任務結果
      this.afterDeclareTaskResult();
    } else if (this.step === 4) {
      // 指派湖中女神
      this.assignGod();
    } else if (this.step === 5) {
      // 刺客現身
      this.declareAssassin();
    } else if (this.step === 6) {
      this.declareGameResult();
    }
  }

  private afterDeclareTaskResult(): void {
    if (this.round > 1) {
      this.incrementGameStep();
    } else {
      this.resetGameStep();
    }
  }

  async createRoom(): Promise<number> {
    const roomId = await GameRoomModel.create(this.host);
    this.roomId = roomId;
    return this.roomId;
  }

  private async setGameRole(): Promise<void> {
    const roles = GameRoleService.getGameRoleList(this.playerCount);
    Object.keys(this.player).forEach((player, index) => {
      this.role[player] = roles[index];
    });
    await GameRoomModel.createGameRole(this.roomId.toString(), this.role);
  }

  private declareGameRole(): void {
    Object.keys(this.player).forEach((name) => {
      const role = this.role[name];
      const client = this.player[name];
      if (role === GameRoleName.MERLIN) {
        this.MERLIN = name;
      } else if (role === GameRoleName.PERCIVAL) {
        this.PERCIVAL = name;
      } else if (role === GameRoleName.OBERON) {
        this.OBERON = name;
      } else if (role === GameRoleName.MORDRED) {
        this.MORDRED = name;
      } else if (role === GameRoleName.MORGANA) {
        this.MORGANA = name;
      } else if (role === GameRoleName.ASSASSIN) {
        this.ASSASSIN = name;
      }
      const action: DeclareRoleAction = {
        type: GameActionType.DECLARE_ROLE,
        payload: role,
      };
      client.send(JSON.stringify(action));
    });
  }

  private revealGameRole(): void {
    Object.keys(this.player).forEach((player) => {
      const role = this.role[player];
      const client = this.player[player];
      if (role === GameRoleName.MERLIN) {
        const revealableEvilPlayers = this.getRevealableEvilPlayers();
        const action: RevealEvilAction = {
          type: GameActionType.REVEAL_EVIL,
          payload: revealableEvilPlayers,
        };
        client.send(JSON.stringify(action));
      } else if (role === GameRoleName.PERCIVAL) {
        const revealableMerlinPlayers = this.getRevealableMerlinPlayers();
        const action: RevealMerlinAction = {
          type: GameActionType.REVEAL_MERLIN,
          payload: revealableMerlinPlayers,
        };
        client.send(JSON.stringify(action));
      } else if (GameRoleService.isKnowEachOtherEvil(role)) {
        const knowEachOtherEvilPlayers = this.getKnowEachOtherEvilPlayers();
        const action: RevealEvilEachAction = {
          type: GameActionType.REVEAL_EVIL_EACH,
          payload: knowEachOtherEvilPlayers,
        };
        client.send(JSON.stringify(action));
      }
    });
  }

  private getRevealableEvilPlayers(): string[] {
    const players: string[] = [];
    Object.keys(this.role).forEach((player) => {
      if (GameRoleService.isRevealableEvil(this.role[player])) {
        players.push(player);
      }
    });

    return players;
  }

  private getRevealableMerlinPlayers(): string[] {
    const players: string[] = [this.MERLIN];
    if (this.MORGANA !== '') {
      players.push(this.MORGANA);
    }
    return players;
  }

  private getKnowEachOtherEvilPlayers(): string[] {
    const players: string[] = [];
    Object.keys(this.role).forEach((player) => {
      if (GameRoleService.isKnowEachOtherEvil(this.role[player])) {
        players.push(player);
      }
    });
    return players;
  }

  private initEachRound(): void {
    this.declareTeamSize();
    this.declareLeader();
  }

  private declareLeader(): void {
    const action: DeclareLeaderAction = {
      type: GameActionType.DECLARE_LEADER,
      payload: this.leader,
    };
    this.broadcastAction(action);
  }

  private declareTeamSize(): void {
    const action: DeclareTeamSizeAction = {
      type: GameActionType.DECLARE_TEAM_SIZE,
      payload: this.getTeamSize,
    };
    this.broadcastAction(action);
  }

  assignTask(): void {
    const action: AassignTaskAction = {
      type: GameActionType.ASSIGN_TASK,
      payload: this.teamMemberList,
    };

    this.broadcastAction(action);
  }

  incrementRound(): void {
    // TODO: 寫進資料庫
    this.round += 1;
    this.declareRound();
  }

  async handleVote(): Promise<void> {
    if (this.isVoteFinished === false) {
      return;
    }

    this.taskList.push(this.taskResult);
    this.declareTaskList();
    this.resetVoteResultList();
    await this.incrementGameStep();
  }

  async handleApprove(): Promise<void> {
    if (this.isApproveFinished === false) {
      return;
    }
    this.declareApprovalResultList();
    this.declareApprovalResult();
    if (this.approveResult === false) {
      this.unApproveCount += 1;
      this.resetGameStep();
    } else {
      this.unApproveCount = 0;
    }
    this.resetApproveList();
    this.declareUnApprovalCount();
  }

  declareResult() {
    this.declareVoteResultList();
    this.declareTaskList();
  }

  declareVoteResultList(): void {
    const action: DeclareTaskResultAction = {
      type: GameActionType.DECLARE_TASK_RESULT,
      payload: this.voteResultList,
    };

    this.broadcastAction(action);
  }

  declareApprovalResultList(): void {
    const action: DeclareApprovalListAction = {
      type: GameActionType.DECLARE_APPROVAL_LIST,
      payload: this.approvalList,
    };

    this.broadcastAction(action);
  }

  declareTaskList(): void {
    const action: DeclareTaskListAction = {
      type: GameActionType.DECLARE_TASK_LIST,
      payload: this.taskList,
    };
    this.broadcastAction(action);
  }

  declarePlayer(): void {
    const action: DeclarePalyerAction = {
      type: GameActionType.DECLARE_PLAYER,
      payload: this.playerList,
    };
    this.broadcastAction(action);
  }

  declareTeam(): void {
    const action: DeclareTeamAction = {
      type: GameActionType.DECLARE_TEAM,
      payload: this.teamMemberList,
    };
    this.broadcastAction(action);
  }

  declareApprovalResult(): void {
    const action: DeclareApprovalResultAction = {
      type: GameActionType.DECLARE_APPROVAL_RESULT,
      payload: this.approveResult,
    };
    this.broadcastAction(action);
  }

  declareUnApprovalCount(): void {
    const action: DeclareUnApprovalCountAction = {
      type: GameActionType.DECLARE_UNAPPROVAL_COUNT,
      payload: this.unApproveCount,
    };
    this.broadcastAction(action);
  }

  declareRevealedPlayerList(): void {
    const action: DeclareRevealedPlayerListAction = {
      type: GameActionType.DECLARE_REVEALED_PLAYER_LIST,
      payload: this.revealedPlayerList,
    };
    this.broadcastAction(action);
  }

  declareRound(): void {
    const action: DeclareRoundAction = {
      type: GameActionType.DECLARE_ROUND,
      payload: this.round,
    };
    this.broadcastAction(action);
  }

  assignGod(): void {
    const action : AssignGodAction = {
      type: GameActionType.ASSIGN_GOD,
      payload: this.leader,
    };
    this.broadcastAction(action);
  }

  declareGodStatement(statement: GodStatement) {
    const action : DeclareGodStatementAction = {
      type: GameActionType.DECLARE_GOD_STATEMENT,
      payload: statement,
    };
    this.broadcastAction(action);
  }

  declareGameResult() {
    const gameResult: GameResult = {
      result: this.gameResult,
      isMerlinKilled: this.isMerlinKilled,
      role: this.role,
    };
    const action: DeclareGameResultAction = {
      type: GameActionType.DECLARE_GAME_RESULT,
      payload: gameResult,
    };
    this.broadcastAction(action);
  }

  declareAssassin() {
    const action: DeclareAssassinAction = {
      type: GameActionType.DECLARE_ASSASSIN,
      payload: this.ASSASSIN,
    };
    this.broadcastAction(action);
  }

  declareKillResult(result: boolean) {
    const action: DeclareKillResultAction = {
      type: GameActionType.DECLARE_KILL_RESULT,
      payload: result,
    };
    this.broadcastAction(action);
  }
}

export default GameService;
