import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RequestPasswordComponent } from './components/request-password/request-password.component';
import { ValidateEmailComponent } from './components/validate-email/validate-email.component';
import { CodeComponent } from './components/code/code.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'request-password', component: RequestPasswordComponent },
  { path: 'validate-email', component: ValidateEmailComponent},
  { path: 'code', component: CodeComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
