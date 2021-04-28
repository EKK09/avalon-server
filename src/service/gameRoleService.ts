import { getRandomSubArray } from '../common/randomHelper';

class GameRoleService {
  static getGoodList(playerCount: number): string[] {
    const merlin = 'Merlin';
    const selectableGoods: string[] = ['Percival', 'good', 'good', 'good', 'good', 'good'];
    const selectedGoods:string[] = [];
    let selectedLength: number = 2;
    if (playerCount === 5) {
      selectedLength = 2;
    } else if (playerCount === 6 || playerCount === 7) {
      selectedLength = 3;
    } else if (playerCount === 8) {
      selectedLength = 4;
    } else if (playerCount === 9 || playerCount === 10) {
      selectedLength = 5;
    }
    const randomGoods = getRandomSubArray(selectableGoods, selectedLength);
    selectedGoods.concat(randomGoods);
    selectedGoods.push(merlin);
    return selectedGoods;
  }

  static getEvilList(playerCount: number) {
    const evils = 'assassin';
    const selectableGoods: string[] = ['Mordred', 'Oberon', 'Morgana', 'good', 'good', 'good'];
    const selectedGoods:string[] = [];
    let selectedLength: number = 2;
    if (playerCount === 5 || playerCount === 6) {
      selectedLength = 2;
    } else if (playerCount === 7 || playerCount === 8 || playerCount === 9) {
      selectedLength = 3;
    } else if (playerCount === 10) {
      selectedLength = 4;
    }
    const randomGoods = getRandomSubArray(selectableGoods, selectedLength);
    selectedGoods.concat(randomGoods);
    selectedGoods.push(evils);
    return selectedGoods;
  }
}

export default GameRoleService;
