import { Component, OnInit } from '@angular/core';
import { createProgram, getWebGLContext } from 'src/app/core/gl-utils';

@Component({
  selector: 'app-sky-box',
  templateUrl: './sky-box.component.html',
  styleUrls: ['./sky-box.component.scss']
})
export class SkyBoxComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.main();
  }

  private main(): void {
    // const canvas = document.querySelector<HTMLCanvasElement>('#webgl');
    // const gl = getWebGLContext(canvas);
    // const program = createProgram(gl);
  }

}
