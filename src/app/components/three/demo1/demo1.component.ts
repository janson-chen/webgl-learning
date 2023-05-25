import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { degree2Radian } from "../../../core/gl-utils";
import { Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
    selector: 'app-demo1',
    templateUrl: './demo1.component.html',
    styleUrls: ['./demo1.component.scss']
})
export class Demo1Component implements OnInit {
    ngOnInit(): void {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGL1Renderer({
            canvas: document.querySelector('#webgl') as HTMLCanvasElement
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        const ambient = new THREE.AmbientLight(0xffffff);
        scene.add(ambient);

        const dL = new THREE.DirectionalLight(0xffffff, 1.5);
        dL.position.z = 1;
        dL.position.x = 1;
        dL.position.y = 1;
        scene.add(dL); //点光源添加到场景中

        const geometry = new THREE.BoxGeometry(10, 10, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffF0 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        camera.position.z = 50;
        // camera.lookAt(1, 1 ,2);
        renderer.render(scene, camera);

        // Line
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf00fff });
        const points = [];
        points.push(new THREE.Vector3(-10, 0, 0));
        points.push(new THREE.Vector3(0, 10, 0));
        points.push(new THREE.Vector3(10, 0, 0));
        // points.push(new THREE.Vector3(-10, 0, 0));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        renderer.render(scene, camera);

        const axisHelper = new THREE.AxesHelper(20);
        scene.add(axisHelper);
        renderer.render(scene, camera);

        // ball
        const geometry2 = new THREE.SphereGeometry(5, 50, 50);
        const material2 = new THREE.MeshPhysicalMaterial({ color:0x0000ff, reflectivity: 1.5});
        const mesh2 = new THREE.Mesh(geometry2, material2);
        mesh2.translateX(10);
        scene.add(mesh2);
        scene.rotateY(0);

        const geometry3 = new THREE.BoxGeometry(100, 100, 100); //创建一个立方体几何对象Geometry
        console.log(geometry3);



        camera.lookAt(new Vector3(0, 0, 0));
        renderer.render(scene, camera);

        // controls
        const controls = new OrbitControls(camera,renderer.domElement);//创建控件对象
        controls.addEventListener('change', () => renderer.render(scene, camera));//监听鼠标、键盘事件
    }
}
