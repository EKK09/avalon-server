import WebSocket from 'ws';
import GameRoomModel from '../model/gameRoomModel';
import GameRoleService from './gameRoleService';

interface Player {
  [key: string]: WebSocket;
}
interface GameRole {
  [key: string]: string;
}

enum GameActionType {
  NONE = '',
  START = 'start'
}

interface GameAction {
  type: GameActionType;
  payload: any;
}

class GameService {
  public host: string = '';

  public roomId: number = 0;

  public webSocketServer: WebSocket.Server;

  public player: Player;

  private role: GameRole = {};

  private step: number = 0;

  public get playerCount(): number {
    return Object.keys(this.player).length;
  }

  constructor(host: string) {
    this.host = host;
    this.player = {};
    this.webSocketServer = new WebSocket.Server({ noServer: true });
    this.webSocketServer.on('connection', (webSocket: WebSocket, name: string) => {
      this.addPlayer(name, webSocket);

      const message = Object.keys(this.player).join(',');
      this.broadcast(message);
      webSocket.on('message', (data: string) => {
        this.handleMessage(data, webSocket);
        console.log(`message from WebSocket Client: ${data}`);
      });
    });
  }

  private async handleMessage(message: string, client: WebSocket): Promise<void> {
    const action: GameAction = GameService.getActionFromMessage(message);

    if (action.type === GameActionType.START && this.isHost(client)) {
      await this.startGame();
      await this.incrementGameStep();
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
    // TODO: handle step

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
      this.player[name].send(`you are ${role}`);
    });
  }
}

export default GameService;
