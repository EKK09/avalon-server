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
  static DB_PORT = process.env.REDIS_DB_PORT;

  static redis = new Redis(GameRoomModel.DB_PORT, { enableAutoPipelining: true });

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

  static async create(playerName: string): Promise<number> {
    const roomId = await GameRoomModel.redis.incr('next_room_id');
    await GameRoomModel.redis.sadd(`game_room:${roomId}`, [playerName]);
    return roomId;
  }
}

export default GameRoomModel;
