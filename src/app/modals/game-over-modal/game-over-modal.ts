import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-game-over-modal',
  imports: [],
  templateUrl: './game-over-modal.html',
  styleUrl: './game-over-modal.scss',
  standalone: true
})
export class GameOverModal {
  @Input() score: number = 0;
  @Output() newGameEvent: EventEmitter<void> = new EventEmitter();

  public newGame() {
    this.newGameEvent.emit();
  }
}
