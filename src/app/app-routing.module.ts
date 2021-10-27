import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MeshComponent } from './components/mesh/mesh.component';
import { RobotArmComponent } from './components/robot-arm/robot-arm.component';
import { SkyBoxComponent } from './components/sky-box/sky-box.component';

const routes: Routes = [
  {
    path: 'mesh',
    component: MeshComponent
  },
  {
    path: 'sky',
    component: SkyBoxComponent
  },
  {
    path: 'arm',
    component: RobotArmComponent
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
