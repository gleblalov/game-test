import {Component, inject} from '@angular/core';
import {GameService} from "../../services/game/game-service";
import {NgOptimizedImage} from "@angular/common";
import {ModalsService} from "../../services/modals/modals-service";

@Component({
  selector: 'app-header',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  standalone: true
})
export class Header {
  public gameService = inject(GameService);
  public modalsService = inject(ModalsService);

  public onPauseGame() {
    this.gameService.pauseGame();
  }

  public onResumeGame() {
    this.gameService.resumeGame();
  }

  public onShowSettingsModal() {
    this.modalsService.isShowSettingsModal.set(true);
  }
}
