import Redis from 'ioredis';

export interface GameRoomReturn {
  success: boolean;
  message: string;
  data: string | null;
}

export interface PlayerRolePayload {
  [key: string]: string;
}

class GameRoomModel {
  static DB_PORT = process.env.REDIS_DB_HOST;

  static redis = new Redis({
    host: process.env.REDIS_DB_HOST,
    port: Number(process.env.REDIS_DB_PORT),
    password: process.env.REDIS_DB_PASSWORD,
    enableAutoPipelining: true,
  });

  static async isPlayerExist(roomId: string, playerName: string): Promise<boolean> {
    const booleanResponse = await GameRoomModel.redis.sismember(`game_room:${roomId}`, playerName);
    return booleanResponse === 1;
  }

  static async addPlayersToRoom(roomId: string, players: string[]): Promise<boolean> {
    const addedCount = await GameRoomModel.redis.sadd(`game_room:${roomId}`, players);
    return addedCount === players.length;
  }

  static async createGameRole(roomId: string, payload: PlayerRolePayload):Promise<void> {
    await GameRoomModel.redis.hmset(`game_role:${roomId}`, payload);
  }

  static async getGameRole(roomId: string):Promise<PlayerRolePayload> {
    const role = await GameRoomModel.redis.hgetall(`game_role:${roomId}`);
    return role;
  }

  static async incrementGameStep(roomId: string): Promise<number> {
    const step = await GameRoomModel.redis.incr(`game_step:${roomId}`);
    return step;
  }

  static async getGameStep(roomId: string): Promise<number> {
    const res = await GameRoomModel.redis.get(`game_step:${roomId}`);

    if (res === null) {
      return 0;
    }
    return Number(res);
  }

  static async create(): Promise<number> {
    const roomId = await GameRoomModel.redis.incr('next_room_id');
    return roomId;
  }
}

export default GameRoomModel;
