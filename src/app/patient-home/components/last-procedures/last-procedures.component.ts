import { Component } from '@angular/core';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';

@Component({
  selector: 'app-last-procedures',
  standalone: true,
  templateUrl: './last-procedures.component.html',
  styleUrls: ['./last-procedures.component.css']
})
export class LastProceduresComponent {
  lastProcedures: MedicalProcedure[] = [];

}
