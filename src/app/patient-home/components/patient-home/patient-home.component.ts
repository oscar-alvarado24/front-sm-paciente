import { Component } from '@angular/core';
import { UpcomingProceduresComponent } from '../upcoming-procedures/upcoming-procedures.component';
import { LeftMenuComponent } from '../left-menu/left-menu.component';
import { OptionsMenuComponent } from '../../../components/options-menu/options-menu.component';
import { LastProceduresComponent } from '../last-procedures/last-procedures.component';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [UpcomingProceduresComponent, LeftMenuComponent, OptionsMenuComponent, LastProceduresComponent],
  templateUrl: './patient-home.component.html',
  styleUrls: ['./patient-home.component.css']
})
export class PatientHomeComponent {

}
