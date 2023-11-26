import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WhenToRetireComponent } from './calculators/when-to-retire/when-to-retire.component';
import { KeyPipe } from './key.pipe';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChooseQuantityComponent } from './form-controls/choose-quantity/choose-quantity.component';
import { OnlyNumberDirective } from './directives/only-number.directive';
import { BaseComponent } from './base/base.component';

@NgModule({
  declarations: [
    AppComponent,
    WhenToRetireComponent,
    KeyPipe,
    ChooseQuantityComponent,
    OnlyNumberDirective,
    BaseComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  providers: [CurrencyPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
