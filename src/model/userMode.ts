import Redis from 'ioredis';

class UserModel {
  static DB_PORT = 6379;

  static async getUserName() {
    try {
      const redis = new Redis(UserModel.DB_PORT);
      const name = await redis.get('user');
      return name;
    } catch (error) {
      console.log(error);
      return '';
    }
  }
}

export default UserModel;
