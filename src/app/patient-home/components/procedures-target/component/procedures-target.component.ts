import { Component, Input } from '@angular/core';
import { TargetProcedure } from '../../../interface/target-procedure';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-procedures-target',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './procedures-target.component.html',
  styleUrls: ['./procedures-target.component.css']
})
export class ProceduresTargetComponent {
  @Input() procedureData!: TargetProcedure;
  @Input() isUpcoming: boolean = true;

  getHeaderClass(): string {
    if (this.isUpcoming) {
      switch (this.procedureData.status?.toLowerCase()) {
        case 'required':
          return 'required-header';
        case 'scheduled':
          return 'upcoming-header';
        default:
          return 'error-header';
      }
    } else {
      // Para citas anteriores, usar diferentes estilos según el estado
      switch (this.procedureData.status?.toLowerCase()) {
        case 'attended':
          return 'completed-header';
        case 'cancelled':
          return 'cancelled-header';
        case 'not_attended':
          return 'missed-header';
        default:
          return 'completed-header';
      }
    }
  }

  getStatusClass(): string {
    return 'status-style';
  }

  getFormattedDate(): string {
    const date = new Date(this.procedureData.date);

    // Nombres de días en español
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Solo últimos 2 dígitos

    return `${dayName} ${day}/${month}/${year}`;
  }

  // Formatear hora (de ISO a formato 12 horas con AM/PM)
  getFormattedTime(): string {
    const date = new Date(this.procedureData.date);

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convertir a formato 12 horas
    hours = hours % 12;
    hours = hours || 12; // la hora '0' debe ser '12'

    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // Función para mostrar tiempo relativo hasta la cita
  getRelativeTime(): string {
    if (!this.isUpcoming) return '';

    const now = new Date();
    const appointmentDate = new Date(this.procedureData.date);
    const diffInMs = appointmentDate.getTime() - now.getTime();

    if (diffInMs < 0) return 'Vencida';

    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    return this.getRelativeTimeLabel(diffInMinutes, diffInHours, diffInDays, diffInWeeks, diffInMonths, diffInYears);
  }

  private getRelativeTimeLabel(
    diffInMinutes: number,
    diffInHours: number,
    diffInDays: number,
    diffInWeeks: number,
    diffInMonths: number,
    diffInYears: number
  ): string {
    if (diffInMinutes < 60) {
      return this.getMinutesLabel(diffInMinutes);
    }
    if (diffInHours < 24) {
      return this.getHoursLabel(diffInHours);
    }
    if (diffInDays < 7) {
      return this.getDaysLabel(diffInDays);
    }
    if (diffInWeeks < 4) {
      return this.getWeeksLabel(diffInWeeks);
    }
    if (diffInMonths < 12) {
      return this.getMonthsLabel(diffInMonths);
    }
    return this.getYearsLabel(diffInYears);
  }

  private getMinutesLabel(minutes: number): string {
    if (minutes === 0) return 'Ahora mismo';
    if (minutes === 1) return 'En 1 minuto';
    return `En ${minutes} minutos`;
  }

  private getHoursLabel(hours: number): string {
    if (hours === 1) return 'En 1 hora';
    return `En ${hours} horas`;
  }

  private getDaysLabel(days: number): string {
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  }

  private getWeeksLabel(weeks: number): string {
    if (weeks === 1) return 'En 1 semana';
    return `En ${weeks} semanas`;
  }

  private getMonthsLabel(months: number): string {
    if (months === 1) return 'En 1 mes';
    return `En ${months} meses`;
  }

  private getYearsLabel(years: number): string {
    if (years === 1) return 'En 1 año';
    return `En ${years} años`;
  }
}
