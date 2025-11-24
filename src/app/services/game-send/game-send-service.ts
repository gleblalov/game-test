import {inject, Injectable} from '@angular/core';
import {Observable, Subscription, timer} from "rxjs";
import {PseudoWebSocketService} from "../pseudo-web-socket/pseudo-web-socket-service";
import {ESocketEvent, SocketEvents} from "../../interfaces/game-send";

@Injectable({
  providedIn: 'root',
})
export class GameSendService {
  private _socketService = inject(PseudoWebSocketService);

  private _sendEventSub$: Subscription | null = null;

  /** start sending data every second */
  public startSendEvent(getData: () => SocketEvents['gameState']) {
    if (!this._socketService.isConnected.value) {
      this._socketService.connect();
    }

    this._sendEventSub$?.unsubscribe();

    this._sendEventSub$ = timer(0, 1000).subscribe(() => {
      this._socketService.emit(ESocketEvent.GAME_STATE, getData());
    });
  }

  /** sending event when object is caught */
  public sendObjectCaught(getData: () => SocketEvents['objectCaught']) {
    this._socketService.emit(ESocketEvent.OBJECT_CAUGHT, getData());
  }

  public getEvent<K extends keyof SocketEvents>(event: K): Observable<SocketEvents[K]> {
    return this._socketService.on(event);
  }

  /** stop stream */
  public stopSendEvent() {
    this._sendEventSub$?.unsubscribe();
    this._socketService.disconnect();
  }
}
