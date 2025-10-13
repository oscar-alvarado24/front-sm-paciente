import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { ProceduresTargetComponent } from '../procedures-target/component/procedures-target.component';
import { TargetProcedure } from '../../interface/target-procedure';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wiew-cards-procedure',
  standalone: true,
  imports: [ProceduresTargetComponent, CommonModule ],
  templateUrl: './wiew-cards-procedure.component.html',
  styleUrls: ['./wiew-cards-procedure.component.css']
})
export class WiewCardsProcedureComponent implements OnInit {

  upcomingAppointments: TargetProcedure[] = [];
  previousAppointments: TargetProcedure[] = [];
  constructor(private readonly storageService: StorageService) { }

  ngOnInit(): void {
    this.loadProcedures();
  }

  loadProcedures(): void {
    this.upcomingAppointments = this.storageService.getItem('upcomingProcedures') || [];
    this.previousAppointments = this.storageService.getItem('lastProcedures') || [];
  }
}
