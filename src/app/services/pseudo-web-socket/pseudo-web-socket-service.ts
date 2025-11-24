import { Injectable } from '@angular/core';
import {BehaviorSubject, filter, map, Observable, Subject} from "rxjs";

import { SocketEvents, SocketData } from '../../interfaces/game-send';

@Injectable({
  providedIn: 'root',
})
export class PseudoWebSocketService {
  public isConnected = new BehaviorSubject<boolean>(false);
  private _eventStream = new Subject<SocketData>();

  /** open connection */
  public connect() {
    this.isConnected.next(true);
    console.log('[PseudoWebSocket] connected');
  }

  /** close connection */
  public disconnect() {
    this.isConnected.next(false);
    console.log('[PseudoWebSocket] disconnected');
  }

  /** CLIENT → SERVER */
  public emit<K extends keyof SocketEvents>(event: K, payload: SocketEvents[K]) {
    if (!this.isConnected) return;

    this._eventStream.next({ event, payload });
  }

  /** SERVER → CLIENT */
  public on<K extends keyof SocketEvents>(event: K): Observable<SocketEvents[K]> {
    return this._eventStream.asObservable().pipe(
        filter(packet => packet.event === event),
        map(packet => packet.payload as SocketEvents[K])
    );
  }
}
