import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as net from 'net';

class GameRoomService {
  static GameRoomServiceList: WebSocket.Server[] = []

  static handleConnection(this:WebSocket.Server, webSocket: WebSocket) {
    console.log(`connection clientCount:${this.clients.size}`);
    webSocket.on('message', GameRoomService.getClientMessageHandler(this));
  }

  static broadcast(clients: Set<WebSocket>, data: any) {
    console.log(`broadcast:${data}`);
    Array.from(clients).forEach((webSocket: WebSocket) => {
      webSocket.send(data);
    });
  }

  static getClientMessageHandler(webSocketServer:WebSocket.Server) {
    const server = webSocketServer;
    return function handleClientMessage(this:WebSocket, data: WebSocket.Data) {
      // TODO: 處理客端訊息
      console.log(`message from WebSocket Client: ${data}`);
      GameRoomService.broadcast(server.clients, `broadcast test:${data}`);
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

  static handleUpgrade(request: IncomingMessage, socket: net.Socket, head: Buffer) {
    const path = request.url || '';

    const roomId = path.replace('/', '');
    const webSocketServer = GameRoomService.getRoomById(roomId);
    if (webSocketServer === null) {
      console.log('webSocketServer null');
      socket.destroy();
      return;
    }
    webSocketServer.handleUpgrade(request, socket, head, (client: WebSocket) => {
      webSocketServer.emit('connection', client, request);
    });
  }

  static createGameRoom(roomId: string) {
    const webSocketServer = new WebSocket.Server({ noServer: true });
    webSocketServer.path = roomId;
    webSocketServer.on('connection', GameRoomService.handleConnection);
    GameRoomService.GameRoomServiceList.push(webSocketServer);
    console.log(`createGameRoom ${roomId} total Room: ${GameRoomService.GameRoomServiceList.length}`);
  }
}

export default GameRoomService;
