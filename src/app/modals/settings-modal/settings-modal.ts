import {Component, computed, effect, inject, OnInit, Signal, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {GameService} from "../../services/game/game-service";
import {ModalsService} from "../../services/modals/modals-service";
import { toSignal } from '@angular/core/rxjs-interop';
import {debounceTime, filter, map, skip} from "rxjs";

interface GameSettingsForm {
  fallingSpeed: number;
  fallingFrequency: number;
  playerSpeed: number;
  gameTime: number;
}

interface ISettingsForm {
  fallingSpeed: FormControl<number>;
  fallingFrequency: FormControl<number>;
  playerSpeed: FormControl<number>;
  gameTime: FormControl<number>;
}

@Component({
  selector: 'app-settings-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
  standalone: true
})
export class SettingsModal implements OnInit {
  public gameService = inject(GameService);
  public modalService = inject(ModalsService);
  public settingsForm: FormGroup<ISettingsForm> = new FormGroup<ISettingsForm>(<ISettingsForm>{
    fallingSpeed: new FormControl(this.gameService.settings.fallingSpeed, [
      Validators.required,
      Validators.min(1),
      Validators.max(5),
      Validators.pattern('^[0-9]+$')
    ]),
    fallingFrequency: new FormControl(this.gameService.settings.fallingFrequency, [
      Validators.required,
      Validators.min(100),
      Validators.max(3000),
      Validators.pattern('^[0-9]+$')
    ]),
    playerSpeed: new FormControl(this.gameService.settings.playerSpeed, [
      Validators.required,
      Validators.min(1),
      Validators.max(10),
      Validators.pattern('^[0-9]+$')
    ]),
    gameTime: new FormControl(this.gameService.settings.gameTime, [
      Validators.required,
      Validators.min(5),
      Validators.pattern('^[0-9]+$')
    ])
  });

  public initialGameTime = signal<null | number>(null);
  public gameTimeChanged = computed(() => {
    const value = this.formValue()?.gameTime;
    const initial = this.initialGameTime();

    return value !== initial;
  });
  public buttonText = computed(() => {
    const isPaused = this.gameService.isPaused();
    const timeChanged = this.gameTimeChanged();

    if (timeChanged) return 'New game';
    if (isPaused) return 'Resume game';

    return 'New game';
  });

  public formValue: Signal<GameSettingsForm | null> = toSignal(
      this.settingsForm.valueChanges.pipe(
          debounceTime(400),
          filter(() => this.settingsForm.valid),
          map(() => this.settingsForm.getRawValue())
      ),
      { initialValue: this.settingsForm.getRawValue() }
  );

  constructor() {
    this.initialGameTime.set(this.gameService.settings.gameTime);

    effect(() => {
      const value = this.formValue();

      if (!value) return;

      this.gameService.updateSettings({
        fallingSpeed: +value.fallingSpeed!,
        fallingFrequency: +value.fallingFrequency!,
        playerSpeed: +value.playerSpeed!,
        gameTime: +value.gameTime!,
      });
    });
  }

  ngOnInit() {
    if (this.gameService.isGameProcessing()) {
      this.gameService.pauseGame();
    }
  }

  public onClick() {
    if (this.gameTimeChanged()) {
      this.gameService.startNewGame();
      this.modalService.isShowSettingsModal.set(false);
      return;
    }

    if (this.gameService.isPaused()) {
      this.gameService.resumeGame();
    } else {
      this.gameService.startNewGame();
    }
    this.modalService.isShowSettingsModal.set(false);
  }
}
