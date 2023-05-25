import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MeshComponent } from './components/mesh/mesh.component';
import { SkyBoxComponent } from './components/sky-box/sky-box.component';
import { RobotArmComponent } from './components/robot-arm/robot-arm.component';
import { Demo1Component } from './components/three/demo1/demo1.component';
import { ImageMergeComponent } from "./components/image-merge/image-merge.component";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@NgModule({
    declarations: [
        AppComponent,
        MeshComponent,
        SkyBoxComponent,
        RobotArmComponent,
        Demo1Component,
        ImageMergeComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        CommonModule,
        FormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
