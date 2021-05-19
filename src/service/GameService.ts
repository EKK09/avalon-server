import WebSocket from 'ws';
import GameRoomModel from '../model/gameRoomModel';
import GameRoleService, { GameRoleName } from './gameRoleService';

interface Player {
  [key: string]: WebSocket;
}
interface GameRole {
  [key: string]: GameRoleName;
}

enum GameActionType {
  NONE = '',
  DECLARE_PLAYER = 'declarePlayer',
  DECLARE_ROUND = 'declareRound',
  START = 'start',
  DECLARE_ROLE = 'declareRole',
  REVEAL_EVIL = 'revealEvil',
  REVEAL_MERLIN = 'revealMerlin',
  REVEAL_EVIL_EACH = 'revealEvilEach',
  ASSIGN_LEADER = 'assignLeader',
  ASSIGN_TEAM = 'assignTeam',
  ASSIGN_TASK = 'assignTask',
  VOTE = 'vote',
  DECLARE_TASK_RESULT = 'declareTaskResult'
}

interface GameAction {
  type: GameActionType;
  payload?: any;
}

interface VoteResult {
  [key: string]: boolean
}

class GameService {
  public host: string = '';

  public roomId: number = 0;

  public webSocketServer: WebSocket.Server;

  public player: Player;

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

  private voteResultList: VoteResult[] = [];

  public get playerCount(): number {
    return Object.keys(this.player).length;
  }

  public get leader(): string {
    return Object.keys(this.player)[this.round - 1];
  }

  private get isVoteFinished(): boolean {
    return this.teamMemberList.length === this.voteResultList.length;
  }

  private get taskResult(): boolean {
    let failCount = 0;

    this.voteResultList.forEach((result) => {
      if (Object.values(result)[0] === false) {
        failCount += 1;
      }
    });

    if (this.round === 4) {
      return failCount < 2;
    }

    return failCount === 0;
  }

  private get getTeamSize(): number {
    const { round, playerCount } = this;
    if (round === 1) {
      return playerCount < 8 ? 2 : 3;
    } if (round === 2) {
      return playerCount < 8 ? 3 : 4;
    } if (round === 3 && playerCount === 5) {
      return 2;
    } if (round === 3 && playerCount === 7) {
      return 3;
    } if (round === 3) {
      return 4;
    } if (round === 4 && (playerCount === 5 || playerCount === 6)) {
      return 3;
    } if (round === 4 && playerCount === 7) {
      return 4;
    } if (round === 4) {
      return 5;
    } if (round === 5 && playerCount === 5) {
      return 3;
    } if (round === 5 && (playerCount === 6 || playerCount === 7)) {
      return 4;
    } if (round === 5) {
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

    if (action.type === GameActionType.VOTE && player in this.player && action.payload !== undefined) {
      const voteResult: VoteResult = {
        [player]: action.payload,
      };
      this.voteResultList.push(voteResult);
      await this.handleVote();
      return;
    }

    this.broadcast(`${this.getPlayerByWebSocket(client)}:${message}`);
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
    return true;
  }

  private async startGame(): Promise<void> {
    await this.setGameRole();
    this.declareGameRole();
  }

  private async incrementGameStep(): Promise<void> {
    const step = await GameRoomModel.incrementGameStep(this.roomId.toString());
    this.step = step;
    this.handleStep();
  }

  private async handleStep() {
    if (this.step === 1) {
      this.revealGameRole();
      this.incrementGameStep();
    } else if (this.step === 2) {
      // first round
      this.incrementRound();
      this.AssignLeader();
    } else if (this.step === 3) {
      this.assignTask();
    } else if (this.step === 4) {
      this.declareVoteResultList();
    } else if (this.step === 5) {
      // second round
      this.incrementRound();
      this.AssignLeader();
    } else if (this.step === 6) {
      this.assignTask();
    } else if (this.step === 7) {
      this.declareVoteResultList();
    }
    // TODO: handle step
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
      const action: GameAction = {
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
        const action: GameAction = {
          type: GameActionType.REVEAL_EVIL,
          payload: revealableEvilPlayers,
        };
        client.send(JSON.stringify(action));
      } else if (role === GameRoleName.PERCIVAL) {
        const revealableMerlinPlayers = this.getRevealableMerlinPlayers();
        const action: GameAction = {
          type: GameActionType.REVEAL_MERLIN,
          payload: revealableMerlinPlayers,
        };
        client.send(JSON.stringify(action));
      } else if (GameRoleService.isKnowEachOtherEvil(role)) {
        const knowEachOtherEvilPlayers = this.getKnowEachOtherEvilPlayers();
        const action: GameAction = {
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

  private AssignLeader(): void {
    const action: GameAction = {
      type: GameActionType.ASSIGN_LEADER,
      payload: this.getTeamSize,
    };
    this.broadcast(JSON.stringify(action));
  }

  assignTask(): void {
    const action: GameAction = {
      type: GameActionType.ASSIGN_TASK,
      payload: this.teamMemberList,
    };
    this.broadcast(JSON.stringify(action));
  }

  incrementRound(): void {
    // TODO: 寫進資料庫
    this.round += 1;
    this.declareRound();
  }

  async handleVote(): Promise<void> {
    if (this.isVoteFinished) {
      await this.incrementGameStep();
    }
  }

  declareVoteResultList(): void {
    const action: GameAction = {
      type: GameActionType.DECLARE_TASK_RESULT,
      payload: this.voteResultList,
    };

    this.broadcast(JSON.stringify(action));
    this.incrementGameStep();
  }

  declarePlayer(): void {
    const action: GameAction = {
      type: GameActionType.DECLARE_PLAYER,
      payload: Object.keys(this.player),
    };
    this.broadcast(JSON.stringify(action));
  }

  declareRound(): void {
    const action: GameAction = {
      type: GameActionType.DECLARE_ROUND,
      payload: this.round,
    };
    this.broadcast(JSON.stringify(action));
  }
}

export default GameService;
