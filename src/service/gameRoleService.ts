import { getRandomSubArray, makeRandomArray } from '../common/randomHelper';

class GameRoleService {
  static getGameRoleList(playerCount: number) {
    const goods = GameRoleService.getGoodList(playerCount);
    const evils = GameRoleService.getEvilList(playerCount);
    const roles = [...goods, ...evils];
    const randomArray = makeRandomArray(roles);
    return randomArray;
  }

  static getGoodList(playerCount: number): string[] {
    const selectableGoods: string[] = ['Percival', 'good', 'good', 'good', 'good', 'good'];
    const selectedGoods:string[] = ['Merlin'];
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
    return selectedGoods.concat(randomGoods);
  }

  static getEvilList(playerCount: number) {
    const selectableEvils: string[] = ['Mordred', 'Oberon', 'Morgana', 'evil', 'evil', 'evil'];
    const selectedEvils:string[] = ['Assassin'];
    let selectedLength: number = 2;
    if (playerCount === 5 || playerCount === 6) {
      selectedLength = 2;
    } else if (playerCount === 7 || playerCount === 8 || playerCount === 9) {
      selectedLength = 3;
    } else if (playerCount === 10) {
      selectedLength = 4;
    }
    const randomEvils = getRandomSubArray(selectableEvils, selectedLength);
    return selectedEvils.concat(randomEvils);
  }
}

export default GameRoleService;
