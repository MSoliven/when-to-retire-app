import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WhenToRetireComponent } from './calculators/when-to-retire/when-to-retire.component';

const routes: Routes = [
  { path: '', component: WhenToRetireComponent },
  { path: 'whenToRetire', component: WhenToRetireComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
