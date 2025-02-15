import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Monster } from "src/app/game/model/Monster";

@Component({
  selector: 'ghs-monster-stats-popup',
  templateUrl: './stats-dialog.html',
  styleUrls: [ './stats-dialog.scss' ]
})
export class MonsterStatsDialogComponent {

  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

  constructor(@Inject(DIALOG_DATA) public monster: Monster) { }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monster);
    monster.isAlly = this.monster.isAlly;
    monster.level = level;
    monster.errors = this.monster.errors;
    return monster;
  }
}