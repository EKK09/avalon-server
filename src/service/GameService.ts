import WebSocket from 'ws';
import GameRoomModel from '../model/gameRoomModel';

interface Player {
  [key: string]: WebSocket;
}

class GameService {
  public host: string = '';

  public roomId: number = 0;

  public webSocketServer: WebSocket.Server;

  public player: Player

  constructor(host: string) {
    this.host = host;
    this.player = {};
    this.webSocketServer = new WebSocket.Server({ noServer: true });
    this.webSocketServer.on('connection', (webSocket: WebSocket, name: string) => {
      this.addPlayer(name, webSocket);
      webSocket.on('message', (data: WebSocket.Data) => {
        console.log(`message from WebSocket Client: ${data}`);
      });
    });
  }

  private addPlayer(name: string, webSocket: WebSocket): boolean {
    if (name in this.player) {
      return false;
    }
    this.player[name] = webSocket;
    return true;
  }

  async createRoom(): Promise<number> {
    const roomId = await GameRoomModel.create(this.host);
    this.roomId = roomId;
    return this.roomId;
  }
}

export default GameService;
