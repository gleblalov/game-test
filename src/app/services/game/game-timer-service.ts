import {Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Subject, takeUntil, timer} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class GameTimerService {
  private _timeRemaining: WritableSignal<number> = signal(1);
  private destroy$ = new Subject<void>();

  public get timeRemaining(): Signal<number> { return this._timeRemaining; }

  startTimer(onFinish: () => void) {
    timer(0, 1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this._timeRemaining.update(t => {
        if (t <= 1) {
          onFinish();
          return 0;
        }
        return t - 1;
      });
    });
  }

  setTimeRemaining(x: number) {
    this._timeRemaining.set(x);
  }

  stopTimer() {
    this.destroy$.next();
  }
}
