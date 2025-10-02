import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { UpcomingProceduresComponent } from '../upcoming-procedures/upcoming-procedures.component';
import { LeftMenuComponent } from '../left-menu/left-menu.component';
import { OptionsMenuComponent } from '../../../commons/components/options-menu/options-menu.component';
import { LastProceduresComponent } from '../last-procedures/last-procedures.component';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [UpcomingProceduresComponent, LeftMenuComponent, OptionsMenuComponent, LastProceduresComponent],
  templateUrl: './patient-home.component.html',
  styleUrls: ['./patient-home.component.css']
})
export class PatientHomeComponent implements OnInit {
  @Output() lastProceduresValue = new EventEmitter<MedicalProcedure[]>();
  @Output() upcomingProceduresValue = new EventEmitter<MedicalProcedure[]>();
  storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  ngOnInit(): void {
    this.getAndClassifyProcedures();
  }
  getAndClassifyProcedures(): void {
    const procedures: MedicalProcedure[] = this.storageService.getItem('procedures') || [];
    const currentDate = new Date();

    const upcoming: MedicalProcedure[] = [];
    const previous: MedicalProcedure[] = [];

    procedures.forEach(procedure => {
      if (procedure.date) {
        if (new Date(procedure.date) >= currentDate) {
          upcoming.push(procedure);
        } else {
          previous.push(procedure);
        }
      } else {
        upcoming.push(procedure);
      }
    });

    // Ordenar próximas citas de más cercana a más lejana
    upcoming.sort((a, b) => {
      if (!a.date) return -1; // Si 'a' no tiene fecha, lo pone al principio
      if (!b.date) return 1;  // Si 'b' no tiene fecha, lo pone al principio

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Ordenar citas anteriores de más reciente a más antigua
    previous.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    this.upcomingProceduresValue.emit(upcoming);
    this.lastProceduresValue.emit(previous);

  }

}
