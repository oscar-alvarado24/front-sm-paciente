import { Component } from '@angular/core';

@Component({
  selector: 'app-request-password',
  templateUrl: './request-password.component.html',
  styleUrls: ['./request-password.component.css']
})
export class RequestPasswordComponent {

  data: any;
  isLoading: boolean = false;
  errorMessage: string = '';
  email: string = '';

  constructor() {}

  
}
