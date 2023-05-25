import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MeshComponent } from './components/mesh/mesh.component';
import { RobotArmComponent } from './components/robot-arm/robot-arm.component';
import { SkyBoxComponent } from './components/sky-box/sky-box.component';
import { Demo1Component } from "./components/three/demo1/demo1.component";
import { ImageMergeComponent } from "./components/image-merge/image-merge.component";

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
    {
        path: 'demo1',
        component: Demo1Component
    },
    {
        path: 'merge',
        component: ImageMergeComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
