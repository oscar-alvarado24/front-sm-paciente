import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { ProceduresTargetComponent } from '../procedures-target/component/procedures-target.component';
import { TargetProcedure } from '../../interface/target-procedure';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wiew-cards-procedure',
  standalone: true,
  imports: [ProceduresTargetComponent, CommonModule],
  templateUrl: './wiew-cards-procedure.component.html',
  styleUrls: ['./wiew-cards-procedure.component.css']
})
export class WiewCardsProcedureComponent implements OnInit {

  upcomingProcedures: TargetProcedure[] = [];
  previousProcedures: TargetProcedure[] = [];
  messageUpcomingProcedures: string = '';
  messagePreviousProcedures: string = '';
  constructor(private readonly storageService: StorageService) { }

  ngOnInit(): void {
    console.log('metodo ngOnInit')
    this.loadProcedures();
  }

  loadProcedures(): void {
    const upcomingProceduressRegistry = this.storageService.getItem('upcomingProcedures');
    const previousAppointmentsRegistry = this.storageService.getItem('lastProcedures');
    if (upcomingProceduressRegistry) {
      try {
        const parseDataUpcoming = JSON.parse(upcomingProceduressRegistry);
        if (Array.isArray(parseDataUpcoming)) {
          console.log('upcomingProcedures es de tipo array:', upcomingProceduressRegistry)
          this.upcomingProcedures = upcomingProceduressRegistry;
          this.messageUpcomingProcedures = '';
        } else {
          console.log('upcomingProcedures es de tipo string:', upcomingProceduressRegistry)
          this.messageUpcomingProcedures = typeof parseDataUpcoming === 'string' ? parseDataUpcoming : JSON.stringify(parseDataUpcoming);
          this.upcomingProcedures = [];
        }
        
      }
      catch (error) {
        console.error('Error al procesar la información:', error);
        this.messageUpcomingProcedures = 'Error: no se pudo procesar la información, intenta mas tarde';
        this.upcomingProcedures = [];
      }
    } else {
      this.upcomingProcedures = [];
      this.messageUpcomingProcedures = 'No hay procedimientos programados';
    }

    if (previousAppointmentsRegistry) {
      try {
        const parseDataPrevious = JSON.parse(previousAppointmentsRegistry);
        if (Array.isArray(parseDataPrevious)) {
          this.previousProcedures = previousAppointmentsRegistry;
          this.messagePreviousProcedures = '';
        } else {
          this.messageUpcomingProcedures = typeof parseDataPrevious === 'string' ? parseDataPrevious : JSON.stringify(parseDataPrevious);
          this.previousProcedures = [];
        }
      }
      catch (error) {
        console.error('Error al procesar la información:', error);
        this.messagePreviousProcedures = 'Error: no se pudo procesar la información, intenta mas tarde';
        this.previousProcedures = [];
      }
    } else {
      this.previousProcedures = [];
      this.messagePreviousProcedures = 'No hay procedimientos pasados';
    }
  }
}
