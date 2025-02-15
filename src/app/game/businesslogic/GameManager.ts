import { Ability } from "../model/Ability";
import { Character } from "../model/Character";
import { CharacterData } from "../model/data/CharacterData";
import { DeckData } from "../model/data/DeckData";
import { EditionData } from "../model/data/EditionData";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioData } from "../model/data/ScenarioData";
import { FigureError, FigureErrorType } from "../model/FigureError";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterType } from "../model/MonsterType";
import { Objective } from "../model/Objective";
import { AttackModifierManager } from "./AttackModifierManager";
import { CharacterManager } from "./CharacterManager";
import { MonsterManager } from "./MonsterManager";
import { settingsManager } from "./SettingsManager";
import { StateManager } from "./StateManager";
import { Condition, ConditionName, Conditions, ConditionType } from "../model/Condition";
import { EntityManager } from "./EntityManager";
import { EventEmitter } from "@angular/core";
import { ItemData } from "../model/data/ItemData";
import { LevelManager } from "./LevelManager";
import { ScnearioManager } from "./ScenarioManager";
import { RoundManager } from "./RoundManager";
import { Entity } from "../model/Entity";
import { MonsterEntity } from "../model/MonsterEntity";
import { Summon } from "../model/Summon";


export class GameManager {

  game: Game = new Game();
  editionData: EditionData[] = [];
  stateManager: StateManager;
  entityManager: EntityManager;
  characterManager: CharacterManager;
  monsterManager: MonsterManager;
  attackModifierManager: AttackModifierManager;
  levelManager: LevelManager;
  scenarioManager: ScnearioManager;
  roundManager: RoundManager;

  uiChange = new EventEmitter();

  constructor() {
    this.stateManager = new StateManager(this.game);
    this.entityManager = new EntityManager(this.game);
    this.characterManager = new CharacterManager(this.game);
    this.monsterManager = new MonsterManager(this.game);
    this.attackModifierManager = new AttackModifierManager(this.game);
    this.levelManager = new LevelManager(this.game);
    this.scenarioManager = new ScnearioManager(this.game);
    this.roundManager = new RoundManager(this.game);
    this.uiChange.subscribe({
      next: () => {
        if (this.game.levelCalculation) {
          this.levelManager.calculateScenarioLevel();
        }
      }
    })
  }

  editions(all: boolean = false): string[] {
    return this.editionData.map((editionData) => editionData.edition).filter((edition) => settingsManager.settings.editions.indexOf(edition) != -1);
  }

  currentEditions(): string[] {
    if (!this.game.edition) {
      return this.editions();
    }

    return [this.game.edition, ...this.editionExtensions(this.game.edition)];
  }

  editionExtensions(edition: string): string[] {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    return editionData && editionData.extensions || [];
  }

  charactersData(all: boolean = false): CharacterData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.characters).flat().filter((characterData, index, characters) => characterData.replace || !characterData.replace && !characters.find((characterDataReplacement) => characterDataReplacement.replace && characterDataReplacement.name == characterData.name && characterDataReplacement.edition == characterData.edition));;
  }

  monstersData(all: boolean = false): MonsterData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.monsters).flat().filter((monsterData, index, monsters) => monsterData.replace || !monsterData.replace && !monsters.find((monsterDataReplacement) => monsterDataReplacement.replace && monsterDataReplacement.name == monsterData.name && monsterDataReplacement.edition == monsterData.edition));
  }

  decksData(all: boolean = false): DeckData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.decks).flat();
  }

  scenarioData(all: boolean = false): ScenarioData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.scenarios).flat();
  }

  sectionData(all: boolean = false): ScenarioData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.sections).flat();
  }

  itemData(all: boolean = false): ItemData[] {
    return this.editionData.filter((editionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extensions && editionData.extensions.indexOf(this.game.edition) != -1).map((editionData) => editionData.items).flat();
  }

  item(id: number, edition: string): ItemData | undefined {
    return this.itemData(true).find((itemData) => itemData && itemData.id == id && itemData.edition == edition);
  }

  hazardousTerrain(): boolean {
    if (this.game.edition) {
      return this.editionData.some((editionData) => editionData.edition == this.game.edition && editionData.hazardousTerrain);
    }
    return false;
  }

  conditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return Conditions;
    }

    const editionData = this.editionData.find((value) => value.edition == this.game.edition);

    if (editionData && editionData.conditions) {
      return editionData.conditions.map((value) => {
        if (value.split(':').length > 1) {
          return new Condition(value.split(':')[0] as ConditionName, + value.split(':')[1]);
        } else {
          return new Condition(value as ConditionName);
        }
      })
    }

    return [];
  }

  conditionsForTypes(...types: string[]): Condition[] {
    return this.conditions(false).filter((condition) => types.every((type) => condition.types.indexOf(type as ConditionType) != -1));
  }

  allConditionsForTypes(...types: string[]): Condition[] {
    return this.conditions(true).filter((condition) => types.every((type) => condition.types.indexOf(type as ConditionType) != -1));
  }

  markers(): string[] {
    return this.game.figures.filter((figure) => figure instanceof Character && figure.marker).map((figure) => (figure as Character).edition + '-' + figure.name);
  }

  sortFigures() {
    this.game.figures.sort((a, b) => {
      if (this.game.state == GameState.draw) {
        return this.sortFiguresByTypeAndName(a, b);
      } else if (settingsManager.settings.initiativeRequired) {
        if (a.getInitiative() == b.getInitiative()) {
          return this.sortFiguresByTypeAndName(a, b);
        }
        return a.getInitiative() - b.getInitiative();
      }

      return 0;
    });
  }

  sortFiguresByTypeAndName(a: Figure, b: Figure): number {
    let aName = a.name.toLowerCase();
    if (a instanceof Character) {
      aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
    } else if (a instanceof Monster) {
      aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
    } else if (a instanceof Objective) {
      aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective')).toLowerCase());
    }

    let bName = b.name.toLowerCase();
    if (b instanceof Character) {
      bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
    } else if (b instanceof Monster) {
      bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
    } else if (b instanceof Objective) {
      bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective')).toLowerCase());
    }
    if (a instanceof Character && b instanceof Monster) {
      return -1;
    } else if (a instanceof Monster && b instanceof Character) {
      return 1;
    } else if (a instanceof Character && b instanceof Objective) {
      return -1;
    } else if (a instanceof Objective && b instanceof Character) {
      return 1;
    } else if (a instanceof Monster && b instanceof Objective) {
      return -1;
    } else if (a instanceof Objective && b instanceof Monster) {
      return 1;
    } else if (a instanceof Monster && b instanceof Monster) {
      return 0;
    }
    return aName < bName ? -1 : 1;
  }

  deckData(figure: Monster | Character): DeckData {
    let deckData = this.decksData(true).find((deck) => (deck.name == figure.deck || deck.name == figure.name) && deck.edition == figure.edition);

    // find extensions decks
    if (!deckData) {
      deckData = this.decksData(true).find((deck) => (deck.name == figure.deck || deck.name == figure.name) && this.editionExtensions(figure.edition).indexOf(deck.edition) != -1);
    }

    if (!deckData) {
      figure.errors = figure.errors || [];
      if (!figure.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !figure.errors.find((figureError) => figureError.type == FigureErrorType.deck)) {
        console.error("Unknwon deck: " + figure.name + (figure.deck ? "[" + figure.deck + "]" : "") + " for " + figure.edition);
        figure.errors.push(new FigureError(FigureErrorType.deck, figure instanceof Character ? "character" : "monster", figure.name, figure.edition, figure.deck));
      }
      return new DeckData('', [], '');
    }

    return deckData;
  }

  abilities(figure: Monster | Character): Ability[] {
    return this.deckData(figure).abilities || [];
  }

  getCharacterData(name: string, edition: string): CharacterData {
    let characterData = this.charactersData(true).find((value) => value.name == name && value.edition == edition);
    if (!characterData) {
      characterData = this.charactersData(true).find((value) => value.name == name);
      if (!characterData) {
        characterData = new CharacterData();
        characterData.name = name;
        characterData.edition = edition;
        characterData.errors = characterData.errors || [];
        if (!characterData.errors.find((figureError) => figureError.type == FigureErrorType.unknown)) {
          console.error("unknown character '" + name + "' for edition '" + edition + "'");
          characterData.errors.push(new FigureError(FigureErrorType.unknown, "character", name, edition));
        }
      }
      return characterData;
    }
    return characterData;
  }

  isCharacter(figure: Figure | Entity): boolean {
    return figure instanceof Character;
  }

  isObjective(figure: Figure | Entity): boolean {
    return figure instanceof Objective;
  }

  isMonster(figure: Figure): boolean {
    return figure instanceof Monster;
  }

  isMonsterEntity(entity: Entity): boolean {
    return entity instanceof MonsterEntity;
  }

  isSummon(entity: Entity): boolean {
    return entity instanceof Summon;
  }

  toCharacter(figure: Figure | Entity): Character {
    return figure as Character;
  }

  toObjective(figure: Figure | Entity): Objective {
    return figure as Objective;
  }

  toMonster(figure: Figure): Monster {
    return figure as Monster;
  }

  toMonsterEntity(entity: Entity): MonsterEntity {
    return entity as MonsterEntity;
  }

  toSummon(entity: Entity): Summon {
    return entity as Summon;
  }

  getEdition(figure: any): string {
    if (this.game.figures.some((value) => typeof (figure) == typeof (value) && figure.name == value.name && figure.edition != value.edition || this.game.edition && figure.edition != this.game.edition)) {
      return figure.edition;
    }
    return "";
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData(true).find((value) => value.name == name && value.edition == edition);
    if (!monsterData) {
      monsterData = this.monstersData(true).find((value) => value.name == name);
      if (!monsterData) {
        monsterData = new MonsterData(name, 0, new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0), [], "");
        monsterData.errors = monsterData.errors || [];
        monsterData.name = name;
        monsterData.edition = edition;
        if (!monsterData.errors.find((figureError) => figureError.type == FigureErrorType.unknown)) {
          console.error("unknown monster '" + name + "' for edition '" + edition + "'");
          monsterData.errors.push(new FigureError(FigureErrorType.unknown, "monster", name, edition));
        }
      }
      return monsterData;
    }

    return monsterData;
  }

}

export const gameManager: GameManager = new GameManager();