import { Component } from '@angular/core';
import {GameBoard} from "./components/game-board/game-board";

@Component({
  selector: 'app-root',
  imports: [
    GameBoard
  ],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App {
}
