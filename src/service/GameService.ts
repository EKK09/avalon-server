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
  TaskResult,
  DeclareOfflineAction,
  DeclarePlayerReturnAction,
  DeclareGameInfoAction,
} from './gameAction';
import WebSocketService from './WebSocketService';
import GameInfoModel from '../model/gameInfoModel';
import { setGameInfo } from '../model/AwsModel';

interface Player {
  [key: string]: WebSocket;
}
export interface GameRole {
  [key: string]: GameRoleName;
}

class GameService {
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

  private god: string = '';

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

  public get hasGod(): boolean {
    return this.playerList.length > 7;
  }

  public get leader(): string {
    const index = (this.round - 1) % this.playerCount;
    return this.playerList[index];
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

    return failCount < this.failThreshold;
  }

  private get failThreshold(): number {
    const votedCount = this.taskList.length;
    if (votedCount === 3) {
      return 2;
    }
    return 1;
  }

  private get failCount(): number {
    const failCount = this.taskList.filter((task) => !task).length;
    return failCount;
  }

  private get successCount(): number {
    const successCount = this.taskList.filter((task) => task).length;
    return successCount;
  }

  private get onlinePlayerCount(): number {
    return Object.keys(this.player).length;
  }

  private get gameResult(): boolean {
    if (this.isMerlinKilled) {
      return false;
    }

    if (this.failCount >= 3) {
      return false;
    }
    if (this.unApproveCount === 5) {
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
    const { playerCount } = this;
    const voteRound = this.taskList.length + 1;
    if (voteRound === 1) {
      return playerCount < 8 ? 2 : 3;
    }
    if (voteRound === 2) {
      return playerCount < 8 ? 3 : 4;
    }
    if (voteRound === 3 && playerCount === 5) {
      return 2;
    }
    if (voteRound === 3 && playerCount === 7) {
      return 3;
    }
    if (voteRound === 3) {
      return 4;
    }
    if (voteRound === 4 && (playerCount === 5 || playerCount === 6)) {
      return 3;
    }
    if (voteRound === 4 && playerCount === 7) {
      return 4;
    }
    if (voteRound === 4) {
      return 5;
    }
    if (voteRound === 5 && playerCount === 5) {
      return 3;
    }
    if (voteRound === 5 && (playerCount === 6 || playerCount === 7)) {
      return 4;
    }
    if (voteRound === 5) {
      return 5;
    }
    return 0;
  }

  constructor() {
    this.player = {};
    this.webSocketServer = new WebSocket.Server({ noServer: true });
    this.webSocketServer.on('connection', (webSocket: WebSocket, name: string) => {
      if (this.round === 0) {
        this.addPlayer(name, webSocket);
        this.declarePlayer();
      } else {
        this.player[name] = webSocket;
        this.declarePlayerReturn(name);
        this.declareGameInfo(name);
      }
      webSocket.on('message', (data: string) => {
        this.handleMessage(data, webSocket);
        console.log(`message from WebSocket Client: ${data}`);
      });
      webSocket.on('close', () => {
        console.log(`${name} close`);
        if (this.round === 0) {
          this.removePlayer(name);
          this.declarePlayer();
        } else {
          this.declareOfflinePlayer(name);
        }
        delete this.player[name];
        if (this.onlinePlayerCount === 0) {
          this.closeGameService();
        }
      });
    });
  }

  private async closeGameService(): Promise<void> {
    WebSocketService.removeService(this);
    this.webSocketServer.close((err) => {
      if (err) {
        console.log('服務關閉出錯');
      } else {
        console.log('服務關閉成功');
      }
    });
  }

  private async handleMessage(message: string, client: WebSocket): Promise<void> {
    const action: GameAction = GameService.getActionFromMessage(message);
    const player = this.getPlayerByWebSocket(client);
    console.log(action);
    if (action.type === GameActionType.START && this.isHost(player) && this.round === 0) {
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

    if (action.type === GameActionType.ASSIGN_REVEAL_PLAYER && this.isGod(player) && !this.isRevealedPlayer(action.payload)) {
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

    if (action.type === GameActionType.ASSIGN_GOD_STATEMENT && this.isGod(player) && action.payload) {
      this.declareGodStatement(action.payload);
      this.god = this.revealedPlayerList[this.revealedPlayerList.length - 1];
      await this.resetGameStep();
      return;
    }
    if (action.type === GameActionType.ASSIGN_KILL_PLAYER && this.ASSASSIN === player && action.payload) {
      const killedPlayer = action.payload;
      this.isMerlinKilled = this.MERLIN === killedPlayer;
      this.declareKillResult();
      this.incrementGameStep();
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

  private get hasAssignRevealPlayer(): boolean {
    return this.taskList.length - 1 === this.revealedPlayerList.length;
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

  public isHost(name: string): boolean {
    return this.playerList[0] === name;
  }

  public isLeader(client: WebSocket): boolean {
    return this.player[this.leader] === client;
  }

  public isGod(player: string): boolean {
    return this.god === player;
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

  public resetTeamMemberList(): void {
    this.teamMemberList = [];
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

  private removePlayer(name: string): void {
    delete this.player[name];
    const playerIndex = this.playerList.indexOf(name);
    if (playerIndex !== -1) {
      this.playerList.splice(playerIndex, 1);
    }
  }

  private async startGame(): Promise<void> {
    await this.setGameRole();
    this.declareGameRole();
    this.revealGameRole();
    if (this.hasGod) {
      const god = this.playerList[1];
      this.god = god;
    }
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
    } else if (this.successCount >= 3 && this.step < 5) {
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
    const voteRound = this.taskList.length;
    if (voteRound > 1 && voteRound < 5 && this.hasGod) {
      this.incrementGameStep();
    } else {
      this.resetGameStep();
    }
  }

  async createRoom(): Promise<number> {
    const roomId = await GameRoomModel.create();
    this.roomId = roomId;
    return this.roomId;
  }

  private async setGameRole(): Promise<void> {
    const roles = GameRoleService.getGameRoleList(this.playerCount);
    Object.keys(this.player).forEach((player, index) => {
      this.role[player] = roles[index];
    });
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

    this.declareTaskResult();
    this.resetVoteResultList();
    this.resetTeamMemberList();
    this.resetApproveList();
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
      this.resetTeamMemberList();
      this.resetApproveList();
      this.resetGameStep();
    } else {
      this.unApproveCount = 0;
    }
    this.declareUnApprovalCount();
  }

  declareTaskResult() {
    this.declareVoteResult();
    this.taskList.push(this.taskResult);
    this.declareTaskList();
  }

  declareVoteResult(): void {
    const failCount = this.voteResultList.filter((vote) => !vote.result).length;
    const payload: TaskResult = {
      result: this.taskResult,
      failCount,
    };
    const action: DeclareTaskResultAction = {
      type: GameActionType.DECLARE_TASK_RESULT,
      payload,
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
      payload: this.god,
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
    setGameInfo(this.roomId, {
      playerInfo: this.role,
      killed: this.isMerlinKilled,
      tasks: this.taskList,
      unApproveCount: this.unApproveCount,
    });
  }

  declareAssassin() {
    const action: DeclareAssassinAction = {
      type: GameActionType.DECLARE_ASSASSIN,
      payload: this.ASSASSIN,
    };
    this.broadcastAction(action);
  }

  declareKillResult() {
    const action: DeclareKillResultAction = {
      type: GameActionType.DECLARE_KILL_RESULT,
      payload: this.isMerlinKilled,
    };
    this.broadcastAction(action);
  }

  declareOfflinePlayer(player: string) {
    const action: DeclareOfflineAction = {
      type: GameActionType.DECLARE_OFFLINE,
      payload: player,
    };
    this.broadcastAction(action);
  }

  declarePlayerReturn(player: string) {
    const action: DeclarePlayerReturnAction = {
      type: GameActionType.DECLARE_PLAYER_RETURN,
      payload: player,
    };
    this.broadcastAction(action);
  }

  declareGameInfo(player: string) {
    let merlins: string[] = [];
    let evils: string[] = [];
    let status: string = 'WAIT';
    let isRevealedPlayerGood: boolean | undefined;
    const role = this.role[player];

    if (role === GameRoleName.MERLIN) {
      evils = this.getRevealableEvilPlayers();
    } else if (role === GameRoleName.PERCIVAL) {
      merlins = this.getRevealableMerlinPlayers();
    } else if (GameRoleService.isKnowEachOtherEvil(role)) {
      evils = this.getKnowEachOtherEvilPlayers();
    }

    if (this.step === 1 && this.leader === player) {
      status = 'SELECT_TASK_PLAYER';
    } else if (this.step === 2 && this.isApproveFinished === false && this.isValidApprover(player)) {
      status = 'APPROVE';
    } else if (this.step === 2 && this.isApproveFinished && this.isValidVoter(player)) {
      status = 'VOTE';
    } else if (this.step === 4 && this.isGod(player) && this.hasAssignRevealPlayer === false) {
      status = 'SELECT_REVEAL_PLAYER';
    } else if (this.step === 4 && this.isGod(player) && this.hasAssignRevealPlayer) {
      const lastRevealedPlayer = this.revealedPlayerList[this.revealedPlayerList.length - 1];

      isRevealedPlayerGood = GameRoleService.isGood(this.role[lastRevealedPlayer]);
      status = 'ASSIGN_GOD_STATEMENT';
    } else if (this.step === 5 && this.ASSASSIN === player) {
      status = 'SELECT_KILL_PLAYER';
    }

    const action: DeclareGameInfoAction = {
      type: GameActionType.DECLARE_GAME_INFO,
      payload: {
        role: this.role[player],
        leader: this.leader,
        teamSize: this.getTeamSize,
        playerList: this.playerList,
        merlins,
        evils,
        taskList: this.taskList,
        unApproveCount: this.unApproveCount,
        teamMemberList: this.teamMemberList,
        revealedPlayerList: this.revealedPlayerList,
        isRevealedPlayerGood,
        status,
      },
    };
    this.player[player].send(JSON.stringify(action));
  }
}

export default GameService;
