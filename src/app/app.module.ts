import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './general/components/home/home.component';
import { ChangePasswordComponent } from './login-process/components/change-password/change-password.component';
import { LoginComponent } from './login-process/components/login/login.component';
import { HeaderComponent } from './general/components/header/header.component';
import { FooterComponent } from './general/components/footer/footer.component';
import { GenerateCodeComponent } from './components/generate-code/generate-code.component';
import { GraphQLModule } from './login-process/modules/graphql.module';
import { PatientModule } from './commons/module/patient/patient.module'
import { HttpClientModule } from '@angular/common/http';
import { CodeComponent } from './components/code/code.component';
import { PasswordComponent } from './login-process/components/password/password.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { PersonalMenuComponent } from './components/personal-menu/personal-menu.component';
import { PatientHomeComponent } from './patient-home/components/patient-home/patient-home.component';
import { QRCodeModule } from 'angularx-qrcode';
import { AuthenticationProcessComponent } from './components/authentication-process/authentication-process.component';
import { EmailComponent } from './login-process/components/email/email.component';
import { CodeTotpComponent } from './login-process/components/code-totp/code-totp.component';
import { CountdownComponent } from './login-process/components/countdown/countdown.component';
import { RecoverPasswordComponent } from './login-process/components/recover-password/recover-password.component';
import { LeftMenuComponent } from './patient-home/components/left-menu/left-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ChangePasswordComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    GenerateCodeComponent,
    CodeComponent,
    PasswordComponent,
    OptionsMenuComponent,
    PersonalMenuComponent,
    PatientHomeComponent,
    AuthenticationProcessComponent,
    EmailComponent,
    CodeTotpComponent,
    CountdownComponent,
    RecoverPasswordComponent,
    LeftMenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    GraphQLModule,
    PatientModule,
    HttpClientModule,
    QRCodeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
