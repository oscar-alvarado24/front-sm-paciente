import { Component } from '@angular/core';
import { LeftMenu } from '../left-menu/left-menu';
import { ViewCardsProcedure } from '../view-cards-procedure/view-cards-procedure';
import { OptionsMenu } from '../../../common/component/options-menu/options-menu';

@Component({
  selector: 'app-patient-home',
  imports: [LeftMenu, ViewCardsProcedure, OptionsMenu],
  templateUrl: './patient-home.html',
  styleUrl: './patient-home.scss',
})
export class PatientHome {}
