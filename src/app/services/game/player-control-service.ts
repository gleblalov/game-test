import {inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';

import {LayoutService} from "../layout/layout-service";

@Injectable({
  providedIn: 'root',
})
export class PlayerControlService {
  private _layoutService = inject(LayoutService);

  private _playerX: WritableSignal<number> = signal(this._getDefaultPosition());

  public get playerX(): Signal<number> { return this._playerX; }

  public move(direction: 'left' | 'right', speed: number) {
    const nextX = direction === 'left' ? this._playerX() - speed : this._playerX() + speed;
    const endBoard = this._layoutService.boardSize().width - this._layoutService.playerSize().width;
    this._playerX.set(Math.max(0, Math.min(endBoard, nextX)));
  }

  public setPosition(x: number) {
    this._playerX.set(x);
  }

  private _getDefaultPosition() {
    const board = this._layoutService.boardSize();
    const player = this._layoutService.playerSize();

    if (!board.width || !player.width) return 180;

    return (board.width / 2) - (player.width / 2)
  }
}
