import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbButtonsModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MeshComponent } from './components/mesh/mesh.component';
import { SkyBoxComponent } from './components/sky-box/sky-box.component';
import { RobotArmComponent } from './components/robot-arm/robot-arm.component';

@NgModule({
  declarations: [
    AppComponent,
    MeshComponent,
    SkyBoxComponent,
    RobotArmComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbButtonsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
