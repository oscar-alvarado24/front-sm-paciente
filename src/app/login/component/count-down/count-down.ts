import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-count-down',
  templateUrl: './count-down.html',
  styleUrl: './count-down.scss',
})
export class CountDown {
  /** Emite cuando el contador llega a cero (true) o se reinicia (false) */
  readonly timerFinished = output<boolean>();

  /** Entrada que controla el reinicio del contador */
  readonly reset = input(false);

  /** Tiempo inicial en segundos */
  private readonly initialTime = 40;

  /** Tiempo restante en segundos (única fuente de verdad) */
  private readonly totalSeconds = signal(0);

  /** Minutos derivados del tiempo restante */
  readonly minutes = computed(() => Math.floor(this.totalSeconds() / 60));

  /** Segundos derivados del tiempo restante */
  readonly seconds = computed(() => this.totalSeconds() % 60);

  private countdownIntervalId?: ReturnType<typeof setInterval>;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.reset()) {
        this.resetTimer();
      }
    });

    this.destroyRef.onDestroy(() => this.clearCountdown());
  }

  private startCountdown(): void {
    this.totalSeconds.set(this.initialTime);

    this.countdownIntervalId = setInterval(() => {
      const currentTime = this.totalSeconds();

      if (currentTime <= 0) {
        this.timerFinished.emit(true);
        this.clearCountdown();
      } else {
        this.totalSeconds.set(currentTime - 1);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }
  }

  private resetTimer(): void {
    this.clearCountdown();
    this.timerFinished.emit(false);
    this.startCountdown();
  }
}