import {computed, inject, Injectable, signal} from '@angular/core';
import {GameService} from "../game/game-service";

@Injectable({
  providedIn: 'root',
})
export class ModalsService {
  public gameService = inject(GameService);

  public isShowGameOverModal = computed(() => this.gameService.timeRemaining() <= 0);
  public isShowSettingsModal = signal<boolean>(false);
}
