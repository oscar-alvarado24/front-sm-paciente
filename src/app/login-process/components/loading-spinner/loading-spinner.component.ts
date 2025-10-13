import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent implements OnInit, OnDestroy {
  
  animationInterval: ReturnType<typeof setInterval> | null = null;
  currentSegment = 0;

  constructor() { }

  ngOnInit(): void {
    this.startAnimation();
  }

  ngOnDestroy() {
    this.stopAnimation();
  }
  
  private startAnimation() {
    // Detener cualquier animación previa
    this.stopAnimation();

    const segments = document.querySelectorAll('.segment');

    // Activar el primer segmento inmediatamente
    segments[this.currentSegment].classList.add('active');

    // Animar el cambio de segmento cada segundo
    this.animationInterval = setInterval(() => {
      // Remover la clase active del segmento actual
      segments[this.currentSegment].classList.remove('active');

      // Pasar al siguiente segmento (circular)
      this.currentSegment = (this.currentSegment + 1) % 18;

      // Activar el nuevo segmento
      segments[this.currentSegment].classList.add('active');
    }, 200); // Cambio cada 200 ms
  }

  stopAnimation() {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
                this.animationInterval = null;
            }
            
            // Limpiar todos los segmentos
            const segments = document.querySelectorAll('.segment');
            segments.forEach(segment => segment.classList.remove('active'));
            this.currentSegment = 0;
        }
}
