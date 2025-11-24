import {inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';

import {LayoutService} from "../layout/layout-service";
import {PlayerControlService} from "./player-control-service";

import {FallingObject} from "../../interfaces/game";

@Injectable({
  providedIn: 'root',
})
export class FallingObjectsService {
  private _layoutService = inject(LayoutService);
  private _playerService = inject(PlayerControlService);

  private _fallingObjects: WritableSignal<FallingObject[]> = signal([]);
  private _counter = 0;

  public get fallingObjects(): Signal<FallingObject[]> { return this._fallingObjects; }

  spawnFallingObjects(size: number = 20) {
    const maxX = this._layoutService.boardSize().width - size;
    const obj: FallingObject = { id: this._counter++, x: Math.random() * maxX, y: 0, size };
    this._fallingObjects.update(arr => [...arr, obj]);
  }

  moveFallingObjects(speed: number) {
    this._fallingObjects.update(arr => arr.map(obj => ({ ...obj, y: obj.y + speed })));
  }

  checkCollisions(): number {
    const playerX = this._playerService.playerX();
    const playerWidth = this._layoutService.playerSize().width;
    const playerY = this._layoutService.boardSize().height - this._layoutService.playerSize().height;

    const caught = this._fallingObjects().filter(obj =>
        obj.y + obj.size >= playerY &&
        obj.x + obj.size >= playerX &&
        obj.x <= playerX + playerWidth
    );

    if (caught.length) {
      this._fallingObjects.update(arr => arr.filter(obj => !caught.includes(obj)));
    }

    // remove objects that went off-screen
    this._fallingObjects.update(arr => arr.filter(obj => obj.y <= this._layoutService.boardSize().height));

    return caught.length;
  }

  reset() {
    this._fallingObjects.set([]);
    this._counter = 0;
  }
}
