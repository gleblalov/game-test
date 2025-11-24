import {inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {EGameStartMode, FallingObject, GameSettings} from "../../interfaces/game";
import {animationFrames, Subject, takeUntil, timer, withLatestFrom} from "rxjs";
import {GameSendService} from "../game-send/game-send-service";
import {ESocketEvent, SocketEvents} from "../../interfaces/game-send";
import {KeyboardEventService} from "../keyboard-event/keyboard-event-service";
import {FallingObjectsService} from "./falling-objects-service";
import {PlayerControlService} from "./player-control-service";
import {GameTimerService} from "./game-timer-service";

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private _gameSendService = inject(GameSendService);
  private _keyboardEventService = inject(KeyboardEventService);
  private _fallingObjectsService = inject(FallingObjectsService);
  private _playerControlService = inject(PlayerControlService);
  private _gameTimerService = inject(GameTimerService);

  private _settings: WritableSignal<GameSettings> = signal<GameSettings>({
    fallingSpeed: 3,
    fallingFrequency: 1200,
    playerSpeed: 5,
    gameTime: 30
  });

  private readonly _score: WritableSignal<number> = signal(0);
  private _isPaused: WritableSignal<boolean> = signal(false);
  private _isGameProcessing: WritableSignal<boolean> = signal(false);

  private destroy$ = new Subject<void>();

  public get score(): Signal<number> {
    return this._score;
  }

  public get playerX(): Signal<number> {
    return this._playerControlService.playerX;
  }

  public get fallingObjects(): Signal<FallingObject[]> {
    return this._fallingObjectsService.fallingObjects;
  }

  public get timeRemaining(): Signal<number> {
    return this._gameTimerService.timeRemaining;
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
    this._settings.update(prev => ({ ...prev, ...settings }));
  }

  public startNewGame() {
    this._resetGame();
    this._isGameProcessing.set(true);
    this._isPaused.set(false);
    this._startProcessingGame(EGameStartMode.NEW)
  }

  public endGame() {
    this._fallingObjectsService.reset();
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
      this._fallingObjectsService.spawnFallingObjects();
    });

    // move objects down ~60fps
    animationFrames()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
      this._fallingObjectsService.moveFallingObjects(this._settings().fallingSpeed);
      const caughtObjects = this._fallingObjectsService.checkCollisions();

      if (caughtObjects) {
          this._score.update(s => s + caughtObjects);
          this._gameSendService.sendObjectCaught(() => this.getDataForSend(ESocketEvent.OBJECT_CAUGHT));
      }
    });

    // game timer
    if (type === EGameStartMode.NEW) {
      this._gameTimerService.stopTimer();
      this._gameTimerService.setTimeRemaining(this._settings().gameTime);
    }
    this._gameTimerService.startTimer(this.endGame);
  }

  private _initListeningKeys() {
    animationFrames()
        .pipe(
            withLatestFrom(this._keyboardEventService.onPressedKeys(['ArrowLeft', 'ArrowRight'])),
            takeUntil(this.destroy$)
        )
        .subscribe(([_, key]) => {
          if (key === 'ArrowLeft') this._movePlayer('left');
          if (key === 'ArrowRight') this._movePlayer('right');
        });
  }

  private _movePlayer(direction: 'left' | 'right') {
    if (this._isPaused()) return;

    this._playerControlService.move(direction, this._settings().fallingSpeed);
  }

  private _resetGame() {
    this._score.set(0);
    this._fallingObjectsService.reset();
  }

  private _unsubscribeEndOrPause() {
    this.destroy$.next();
    this.destroy$.complete();

    this._gameTimerService.stopTimer();
    this._gameSendService.stopSendEvent();
  }

  /** get data by event type */
  private getDataForSend<K extends keyof SocketEvents>(event: K): SocketEvents[K] {
    switch (event) {
      case 'gameState':
        return {
          caughtObjects: this._score(),
          timeRemaining: this.timeRemaining(),
        } as SocketEvents[K];
      case 'objectCaught':
        return { caughtObjects: this._score() } as SocketEvents[K];
      default:
        throw new Error(`Unknown event: ${event}`);
    }
  }
}
