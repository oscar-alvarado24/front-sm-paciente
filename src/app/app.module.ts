import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './general/components/home/home.component';
import { HeaderComponent } from './general/components/header/header.component';
import { FooterComponent } from './general/components/footer/footer.component';
import { GraphQLModule } from './commons/module/patient/graphql.module'
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationProcessComponent } from './components/authentication-process/authentication-process.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    AuthenticationProcessComponent
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
