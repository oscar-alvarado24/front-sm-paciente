import { Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.css']
})
export class CountdownComponent implements OnDestroy {
  //Emisor con el valor de finalizacion del tiempo
  @Output() timerFinished = new EventEmitter<boolean>()

  //entrada que controla el reinicio del tiempo
  @Input() reset: boolean = false;
  
  // Tiempo inicial en segundos 
  initialTime: number = 40;
  
  // Variables para mostrar el tiempo
  minutes: number = 0;
  seconds: number = 0;
  
  // Estado del contador y botón
  countdownInterval: any;

 

  ngOnDestroy() {
    this.clearCountdown();
  }

  startCountdown() {
    // Establecer tiempo inicial
    this.updateTimeDisplay(this.initialTime);

    // Iniciar el intervalo
    this.countdownInterval = setInterval(() => {
      const currentTime = this.minutes * 60 + this.seconds;
      
      if (currentTime <= 0) {
        // El contador ha llegado a cero
        this.timerFinished.emit(true);
        this.clearCountdown();
      } else {
        // Actualizar el tiempo restante
        this.updateTimeDisplay(currentTime - 1);
      }
    }, 1000);
  }

  clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  updateTimeDisplay(totalSeconds: number) {
    this.minutes = Math.floor(totalSeconds / 60);
    this.seconds = totalSeconds % 60;
  }

  // Método para reiniciar el contador 
  resetTimer() {
    this.clearCountdown();
    this.timerFinished.emit(false);
    this.startCountdown();
  }

  ngOnChanges(changes: SimpleChanges) {
      if (changes['reset'] && changes['reset'].currentValue === true) {
        this.resetTimer();
      }
    }
}
