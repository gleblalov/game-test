import { Injectable } from '@angular/core';
import {fromEvent, map, merge, Observable, shareReplay} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class KeyboardEventService {
  private keyState = new Set<string>();

  private _keyDown$ = fromEvent<KeyboardEvent>(window, 'keydown');
  private _keyUp$ = fromEvent<KeyboardEvent>(window, 'keyup');

  public onPressedKeys(keys: string[]): Observable<string | null> {
    return merge(
        this._keyDown$.pipe(map(e => ({ type: 'down', key: e.key }))),
        this._keyUp$.pipe(map(e => ({ type: 'up', key: e.key })))
    ).pipe(
        map(event => {
          if (event.type === 'down') this.keyState.add(event.key);
          if (event.type === 'up') this.keyState.delete(event.key);

          const pressed = keys.find(k => this.keyState.has(k));
          return pressed ?? null;
        }),
        shareReplay(1)
    );
  }
}
