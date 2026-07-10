import { Component, Input } from '@angular/core';
import { TargetProcedure } from '../../../model/target-procedure';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-procedures-target',
  imports: [NgClass],
  templateUrl: './procedures-target.html',
  styleUrl: './procedures-target.scss',
})
export class ProceduresTarget {
  @Input() procedureData!: TargetProcedure;
  @Input() isUpcoming = true;

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
    }
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

  getStatusClass(): string {
    return 'status-style';
  }

  getFormattedDate(): string {
    const date = new Date(this.procedureData.date);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${dayName} ${day}/${month}/${year}`;
  }

  getFormattedTime(): string {
    const date = new Date(this.procedureData.date);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  getRelativeTime(): string {
    if (!this.isUpcoming) return '';

    const diffInMs = new Date(this.procedureData.date).getTime() - Date.now();
    if (diffInMs < 0) return 'Vencida';

    const mins = Math.floor(diffInMs / 60_000);
    if (mins < 60) return this.formatMinutes(mins);

    const hours = Math.floor(diffInMs / 3_600_000);
    if (hours < 24) return this.formatHours(hours);

    const days = Math.floor(diffInMs / 86_400_000);
    if (days < 7) return this.formatDays(days);

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return this.formatWeeks(weeks);

    const months = Math.floor(days / 30);
    if (months < 12) return this.formatMonths(months);

    const years = Math.floor(days / 365);
    return this.formatYears(years);
  }

  private formatMinutes(mins: number): string {
    if (mins === 0) return 'Ahora mismo';
    if (mins === 1) return 'En 1 minuto';
    return `En ${mins} minutos`;
  }

  private formatHours(hours: number): string {
    return hours === 1 ? 'En 1 hora' : `En ${hours} horas`;
  }

  private formatDays(days: number): string {
    return days === 1 ? 'Mañana' : `En ${days} días`;
  }

  private formatWeeks(weeks: number): string {
    return weeks === 1 ? 'En 1 semana' : `En ${weeks} semanas`;
  }

  private formatMonths(months: number): string {
    return months === 1 ? 'En 1 mes' : `En ${months} meses`;
  }

  private formatYears(years: number): string {
    return years === 1 ? 'En 1 año' : `En ${years} años`;
  }

  get showDate(): boolean {
    return this.procedureData.status !== 'REQUIRED';
  }

  get showObservations(): boolean {
    return !!this.procedureData.observations && this.procedureData.observations !== 'N/A';
  }

  get showTimeIndicator(): boolean {
    return this.isUpcoming && !!this.procedureData.date && this.procedureData.status !== 'REQUIRED';
  }
}
