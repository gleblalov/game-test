import {Component, OnInit, AfterViewInit, inject, ViewChild, ElementRef} from '@angular/core';
import {GameService} from "../../services/game/game-service";
import {GameOverModal} from "../../modals/game-over-modal/game-over-modal";
import {Header} from "../header/header";
import {ModalsService} from "../../services/modals/modals-service";
import {SettingsModal} from "../../modals/settings-modal/settings-modal";
import {LayoutService} from "../../services/layout/layout-service";

@Component({
  selector: 'app-game-board',
  imports: [
    GameOverModal,
    Header,
    SettingsModal

  ],
  templateUrl: './game-board.html',
  styleUrl: './game-board.scss',
  standalone: true
})
export class GameBoard implements OnInit, AfterViewInit{
  public gameService = inject(GameService);
  public modalsService = inject(ModalsService);
  private _layoutService = inject(LayoutService);

  @ViewChild('board') boardRef!: ElementRef;
  @ViewChild('player') playerRef!: ElementRef;

  ngAfterViewInit() {
    this._layoutService.setBoardSize(this.boardRef);
    this._layoutService.setPlayerSize(this.playerRef);
  }

  ngOnInit() {
    this.modalsService.isShowSettingsModal.set(true);
  }

  public startNewGame() {
    this.gameService.startNewGame();
  }
}
