import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as net from 'net';
import GameRoomModel, { PlayerRolePayload } from '../model/gameRoomModel';
import GameRoleService from './gameRoleService';

interface NamedClient extends WebSocket {
  player: string;
}
class GameRoomService {
  static GameRoomServiceList: WebSocket.Server[] = []

  static handleConnection(this:WebSocket.Server, webSocket: NamedClient) {
    console.log(`connection clientCount:${this.clients.size} player:${webSocket.player}`);
    webSocket.on('message', (data: WebSocket.Data) => {
      console.log(`message from WebSocket Client: ${data}`);
      GameRoomService.broadcast(this.clients, `${webSocket.player}:${data}`);
    });
    // GameRoomService.broadcast(this.clients, `welcome ${webSocket.player}`);
  }

  static broadcast(clients: Set<WebSocket>, data: any) {
    console.log(`broadcast:${data}`);
    Array.from(clients).forEach((webSocket: WebSocket) => {
      webSocket.send(data);
    });
  }

  static async sendRole(room: WebSocket.Server) {
    console.log('sendRole');
    const roomId = room.path;
    const gameRole = await GameRoomModel.getGameRole(roomId);
    Array.from(room.clients).forEach((client: any) => {
      const role = gameRole[client.player];
      client.send(`you are ${role}`);
    });
  }

  static getClientMessageHandler(webSocketServer:WebSocket.Server) {
    const server = webSocketServer;
    return function handleClientMessage(this:NamedClient, data: WebSocket.Data) {
      console.log(`message from WebSocket Client: ${data}`);
      GameRoomService.broadcast(server.clients, `${this.player}:${data}`);
    };
  }

  static getRoomById(id: string): WebSocket.Server | null {
    const rooms = GameRoomService.GameRoomServiceList;

    for (let index = 0; index < rooms.length; index += 1) {
      const room = rooms[index];
      if (room.path === id) {
        return room;
      }
    }

    return null;
  }

  static async startGame(roomId: string): Promise<boolean> {
    const room = GameRoomService.getRoomById(roomId);
    if (room === null) {
      return false;
    }
    const players = Array.from(room.clients).map((client: any) => client.player);
    const roles = GameRoleService.getGameRoleList(players.length);
    const playerRolePayload: PlayerRolePayload = {};
    players.forEach((player, index) => {
      playerRolePayload[player] = roles[index];
    });
    await GameRoomModel.createGameRole(roomId, playerRolePayload);
    GameRoomService.broadcast(room.clients, 'game start');
    GameRoomService.sendRole(room);
    return true;
  }

  static handleUpgrade(request: IncomingMessage, socket: net.Socket, head: Buffer) {
    try {
      if (!request.url) {
        throw new Error();
      }
      const pathRex = /^\/(\w+)\/(\w+)/;
      const matcher = request.url.match(pathRex);

      if (matcher === null) {
        throw new Error();
      }
      const [, roomId, player] = matcher;
      console.log({ roomId, player });
      const webSocketServer = GameRoomService.getRoomById(roomId);

      if (webSocketServer === null) {
        console.log('webSocketServer null');
        socket.destroy();
        return;
      }

      webSocketServer.handleUpgrade(request, socket, head, (client: WebSocket) => {
        Object.defineProperty(client, 'player', {
          get() { return player; },
        });
        webSocketServer.emit('connection', client, request);
      });
    } catch (error) {
      console.log(error);
      socket.destroy();
    }
  }

  static async createGameRoom(playerName: string): Promise<number> {
    const roomId = await GameRoomModel.create(playerName);
    const webSocketServer = new WebSocket.Server({ noServer: true });
    webSocketServer.path = roomId.toString();
    webSocketServer.on('connection', GameRoomService.handleConnection);
    GameRoomService.GameRoomServiceList.push(webSocketServer);
    console.log(`createGameRoom ${roomId} total Room: ${GameRoomService.GameRoomServiceList.length}`);
    return roomId;
  }
}

export default GameRoomService;
