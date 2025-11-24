import {inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {EGameStartMode, FallingObject, GameSettings} from "../../interfaces/game";
import {animationFrames, Subject, takeUntil, timer, withLatestFrom} from "rxjs";
import {GameSendService} from "../game-send/game-send-service";
import {ESocketEvent, SocketEvents} from "../../interfaces/game-send";
import {KeyboardEventService} from "../keyboard-event/keyboard-event-service";
import {LayoutService} from "../layout/layout-service";

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private _gameSendService = inject(GameSendService);
  private _keyboardEventService = inject(KeyboardEventService);
  private _layoutService = inject(LayoutService);

  private _settings: WritableSignal<GameSettings> = signal<GameSettings>({
    fallingSpeed: 3,
    fallingFrequency: 1200,
    playerSpeed: 5,
    gameTime: 30
  });

  private readonly _playerX: WritableSignal<number> = signal(180);
  private readonly _score: WritableSignal<number> = signal(0);
  private readonly _fallingObjects: WritableSignal<FallingObject[]> = signal<FallingObject[]>([]);
  private readonly _timeRemaining: WritableSignal<number> = signal(this._settings().gameTime);
  private _isPaused: WritableSignal<boolean> = signal(false);
  private _isGameProcessing: WritableSignal<boolean> = signal(false);

  private destroy$ = new Subject<void>();

  private objectIdCounter = 0;

  public get playerX(): Signal<number> {
    return this._playerX;
  }

  public get score(): Signal<number> {
    return this._score;
  }

  public get fallingObjects(): Signal<FallingObject[]> {
    return this._fallingObjects;
  }

  public get timeRemaining(): Signal<number> {
    return this._timeRemaining;
  }

  public get isPaused(): Signal<boolean> {
    return this._isPaused;
  }

  public get isGameProcessing(): Signal<boolean> {
    return this._isGameProcessing;
  }

  public get settings(): GameSettings {
    return this._settings();
  }

  public updateSettings(settings: Partial<GameSettings>) {
    console.log('updateSettings')
    this._settings.update(prev => ({ ...prev, ...settings }));
  }

  public startNewGame() {
    this._resetGame();
    this._isGameProcessing.set(true);
    this._isPaused.set(false);
    this._startProcessingGame(EGameStartMode.NEW)
  }

  public endGame() {
    this._fallingObjects.set([]);
    this._unsubscribeEndOrPause();
  }

  public pauseGame() {
    if (!this._isPaused()) {
      this._isPaused.set(true);
      this._unsubscribeEndOrPause();
    }
  }

  public resumeGame() {
    if (this._isPaused()) {
      this._isPaused.set(false);
      this._isGameProcessing.set(true);
      this._startProcessingGame(EGameStartMode.RESUME)
    }
  }

  movePlayer(direction: 'left' | 'right') {
    if (this._isPaused()) return;

    this._playerX.update(x => {
      const nextX = direction === 'left' ? x - this._settings().playerSpeed : x + this._settings().playerSpeed;
      // board width limit, for example 0-400px
      const endBoard = this._layoutService.boardSize().width - this._layoutService.playerSize().width;
      return Math.max(0, Math.min(endBoard, nextX));
    });
  }

  private spawnObject() {
    const endBoard = this._layoutService.boardSize().width - this._layoutService.objectSize(); // board width limit so that the object does not go beyond the border
    const newObj: FallingObject = {
      id: this.objectIdCounter++,
      x: Math.random() * endBoard,
      y: 0,
      size: 20
    };
    this._fallingObjects.update(arr => [...arr, newObj]);
  }

  private moveObjects() {
    this._fallingObjects.update(arr =>
        arr.map(obj => ({ ...obj, y: obj.y + this._settings().fallingSpeed }))
    );
  }

  private checkCollisions() {
    const playerX = this._playerX();
    const playerWidth = this._layoutService.playerSize().width; // width of player rectangle
    const playerY =  this._layoutService.boardSize().height - this._layoutService.playerSize().height; // fixed bottom position

    const caughtObjects = this._fallingObjects().filter(obj =>
        obj.y + obj.size >= playerY &&
        obj.x + obj.size >= playerX &&
        obj.x <= playerX + playerWidth
    );

    if (caughtObjects.length) {
      this._score.update(s => s + caughtObjects.length);
      this._fallingObjects.update(arr => arr.filter(obj => !caughtObjects.includes(obj)));
      this._gameSendService.sendObjectCaught(() => this.getDataForSend(ESocketEvent.OBJECT_CAUGHT));
    }

    // remove objects that went off-screen
    this._fallingObjects.update(
        arr => arr.filter(obj => obj.y <= this._layoutService.boardSize().height)
    );
  }

  private _startProcessingGame(type: EGameStartMode) {
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
    this._gameSendService.startSendEvent(() => this.getDataForSend(ESocketEvent.GAME_STATE));
    this._gameSendService.getEvent(ESocketEvent.GAME_STATE)
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          // console.log('SERVER → CLIENT [gameState]:', data);
        });
    this._gameSendService.getEvent(ESocketEvent.OBJECT_CAUGHT)
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          // console.log('SERVER → CLIENT [objectCaught]:', data);
        });
    
    this._initListeningKeys();

    // spawn objects
    timer(0, this._settings().fallingFrequency)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
      this.spawnObject();
    });

    // move objects down ~60fps
    animationFrames()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
      this.moveObjects();
      this.checkCollisions();
    });

    // game timer
    if (type === EGameStartMode.NEW) {
      this._timeRemaining.set(this._settings().gameTime);
    }
    timer(0, 1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
      this._timeRemaining.update(time => {
        if (time <= 1) {
          this.endGame();
          return 0;
        }
        return time - 1;
      });
    });
  }

  private _initListeningKeys() {
    animationFrames()
        .pipe(
            withLatestFrom(this._keyboardEventService.onPressedKeys(['ArrowLeft', 'ArrowRight'])),
            takeUntil(this.destroy$)
        )
        .subscribe(([_, key]) => {
          if (key === 'ArrowLeft') this.movePlayer('left');
          if (key === 'ArrowRight') this.movePlayer('right');
        });
  }

  private _resetGame() {
    this._score.set(0);
    this._fallingObjects.set([]);
  }

  private _unsubscribeEndOrPause() {
    this.destroy$.next();
    this.destroy$.complete();

    this._gameSendService.stopSendEvent();
  }

  /** get data by event type */
  private getDataForSend<K extends keyof SocketEvents>(event: K): SocketEvents[K] {
    switch (event) {
      case 'gameState':
        return {
          caughtObjects: this._score(),
          timeRemaining: this._timeRemaining(),
        } as SocketEvents[K];
      case 'objectCaught':
        return { caughtObjects: this._score() } as SocketEvents[K];
      default:
        throw new Error(`Unknown event: ${event}`);
    }
  }
}
