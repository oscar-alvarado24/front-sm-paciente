import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { LoginComponent } from './components/login/login.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { GenerateCodeComponent } from './components/generate-code/generate-code.component';
import { GraphQLModule } from './graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { CodeComponent } from './components/code/code.component';
import { PasswordComponent } from './components/password/password.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { PersonalMenuComponent } from './components/personal-menu/personal-menu.component';
import { PrincipalHomeComponent } from './components/principal-home/principal-home.component';

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
    PrincipalHomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    GraphQLModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
