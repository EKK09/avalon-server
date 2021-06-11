import Redis from 'ioredis';

export interface PlayerRolePayload {
  [key: string]: string;
}

export interface PlayerInfo {
  [key: string]: string;
}
export interface GameInfo {
  playerInfo: PlayerInfo;
  tasks: boolean[];
  unApproveCount: number;
  killed: boolean;
}

class GameInfoModel {
  static DB_PORT = process.env.REDIS_DB_PORT;

  static redis = new Redis(GameInfoModel.DB_PORT, { enableAutoPipelining: true });

  static async setPlayerInfo(roomId: string, playerInfo: PlayerInfo): Promise<void> {
    await GameInfoModel.redis.hmset(`game_player_info:${roomId}`, playerInfo);
  }

  static async getPlayerInfo(roomId: string): Promise<PlayerInfo> {
    const playerInfo = await GameInfoModel.redis.hgetall(`game_player_info:${roomId}`);
    return playerInfo;
  }

  static async setTaskList(roomId: string, tasks: boolean[]): Promise<void> {
    const taskStrings = tasks.map((task) => (task ? '1' : '0'));
    await GameInfoModel.redis.lpush(`game_task:${roomId}`, taskStrings);
  }

  static async getTaskList(roomId: string): Promise<boolean[]> {
    const taskStrings = await GameInfoModel.redis.lrange(`game_task:${roomId}`, 0, -1);
    return taskStrings.map((string) => (string === '1'));
  }

  static async setUnApproveCount(roomId: string, count: number): Promise<void> {
    await GameInfoModel.redis.set(`game_unapprove:${roomId}`, count);
  }

  static async getUnApproveCount(roomId: string): Promise<number> {
    const unApproveCountString = await GameInfoModel.redis.get(`game_unapprove:${roomId}`);
    return Number(unApproveCountString);
  }

  static async setIsMerlinKilled(roomId: string, killed: boolean): Promise<void> {
    const killedString = killed ? '1' : '0';
    await GameInfoModel.redis.set(`game_killed:${roomId}`, killedString);
  }

  static async getIsMerlinKilled(roomId: string): Promise<boolean> {
    const killedString = await GameInfoModel.redis.get(`game_killed:${roomId}`);
    return Boolean(Number(killedString));
  }

  static async setGameInfo(roomId: string, gameInfo: GameInfo): Promise<void> {
    await Promise.all([
      GameInfoModel.setPlayerInfo(roomId, gameInfo.playerInfo),
      GameInfoModel.setTaskList(roomId, gameInfo.tasks),
      GameInfoModel.setUnApproveCount(roomId, gameInfo.unApproveCount),
      GameInfoModel.setIsMerlinKilled(roomId, gameInfo.killed),
    ]);
  }

  static async getGameInfo(roomId: string): Promise<GameInfo> {
    const playerInfo = await GameInfoModel.getPlayerInfo(roomId);
    const tasks = await GameInfoModel.getTaskList(roomId);
    const unApproveCount = await GameInfoModel.getUnApproveCount(roomId);
    const killed = await GameInfoModel.getIsMerlinKilled(roomId);
    return {
      playerInfo,
      tasks,
      unApproveCount,
      killed,
    };
  }
}

export default GameInfoModel;
