import {ElementRef, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {ISize, LayoutProvider} from "./layout-provider";

@Injectable({
  providedIn: 'root',
})
export class LayoutService extends LayoutProvider {
  private _boardSize: WritableSignal<ISize> = signal({ width: 400, height: 400 });
  private _playerSize: WritableSignal<ISize> = signal({ width: 40, height: 20 });
  private _objectSize: WritableSignal<number> = signal(20);

  public get boardSize(): Signal<ISize> { return this._boardSize; }
  public get playerSize(): Signal<ISize> { return this._playerSize; }
  public get objectSize(): Signal<number> { return this._objectSize; }

  public setBoardSize(ref: ElementRef) {
    this._boardSize.set({ width: ref.nativeElement.offsetWidth, height: ref.nativeElement.offsetHeight });
  }

  public setPlayerSize(ref: ElementRef) {
    this._playerSize.set({ width: ref.nativeElement.offsetWidth, height: ref.nativeElement.offsetHeight });
  }
}
