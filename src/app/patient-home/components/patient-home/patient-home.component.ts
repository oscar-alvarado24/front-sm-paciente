import { Component } from '@angular/core';
import { LeftMenuComponent } from '../left-menu/left-menu.component';
import { OptionsMenuComponent } from '../../../commons/components/options-menu/options-menu.component';
import { WiewCardsProcedureComponent } from '../wiew-cards-procedure/wiew-cards-procedure.component';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [LeftMenuComponent, OptionsMenuComponent, WiewCardsProcedureComponent],
  templateUrl: './patient-home.component.html',
  styleUrls: ['./patient-home.component.css']
})
export class PatientHomeComponent {

  constructor() {
  }

}


