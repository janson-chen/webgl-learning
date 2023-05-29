import { Component, OnInit } from '@angular/core';
import {
    AmbientLight,
    ArcCurve,
    AxesHelper,
    BoxGeometry,
    BufferGeometry,
    CatmullRomCurve3,
    CubicBezierCurve3,
    DirectionalLight,
    DoubleSide,
    LatheGeometry,
    Line,
    Line3,
    LineBasicMaterial,
    LineCurve3,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshPhysicalMaterial, Path,
    PerspectiveCamera,
    Scene,
    Shape,
    ShapeGeometry,
    SphereGeometry,
    TubeGeometry,
    Vector2,
    Vector3,
    WebGL1Renderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Geometry } from 'three/examples/jsm/deprecated/Geometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

@Component({
    selector: 'app-demo1',
    templateUrl: './demo1.component.html',
    styleUrls: ['./demo1.component.scss']
})
export class Demo1Component implements OnInit {
    ngOnInit(): void {
        const scene = new Scene();
        const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new WebGL1Renderer({
            canvas: document.querySelector('#webgl') as HTMLCanvasElement
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.lookAt(new Vector3(0, 0, 0));
        camera.position.z = 50;

        // controls
        const controls = new OrbitControls(camera,renderer.domElement);//创建控件对象
        controls.addEventListener('change', () => renderer.render(scene, camera));//监听鼠标、键盘事件

        const ambient = new AmbientLight(0xffffff);
        scene.add(ambient);

        const dL = new DirectionalLight(0xffffff, 1.5);
        dL.position.z = 1;
        dL.position.x = 1;
        dL.position.y = 1;
        scene.add(dL); //点光源添加到场景中

        // const geometry = new BoxGeometry(10, 10, 2);
        // const material = new MeshBasicMaterial({ color: 0x00ffF0 });
        // const cube = new Mesh(geometry, material);
        // scene.add(cube);

        // Line
        const lineMaterial = new LineBasicMaterial({ color: 0xf00fff });
        const points = [];
        points.push(new Vector3(-10, 0, 0));
        points.push(new Vector3(0, 10, 0));
        points.push(new Vector3(10, 0, 0));
        // points.push(new Vector3(-10, 0, 0));
        const lineGeometry = new BufferGeometry().setFromPoints(points);
        const line = new Line(lineGeometry, lineMaterial);
        scene.add(line);

        const axisHelper = new AxesHelper(20);
        scene.add(axisHelper);

        // ball
        const geometry2 = new SphereGeometry(5, 50, 50);
        const material2 = new MeshPhysicalMaterial({ color:0x0000ff, reflectivity: 1.5});
        const mesh2 = new Mesh(geometry2, material2);
        mesh2.translateX(10);
        scene.add(mesh2);
        scene.rotateY(0);


        const geometry4 = new BufferGeometry();
        const src = new ArcCurve(0, 0, 10, 0, Math.PI * 2);
        const points2 = src.getPoints(50); // 分50段， 返回51个顶点.
        geometry4.setFromPoints(points2);
        const mertial4 = new LineBasicMaterial({color: 0xff0000});
        const line2 = new Line(geometry4, mertial4);
        scene.add(line2);
        //renderer.render(scene, camera);

        const geometry5 = new BufferGeometry(); //声明一个几何体对象Geometry
        const p1 = new Vector3(0, 0, 0); //顶点1坐标
        const p2 = new Vector3(10, 10, 10); //顶点2坐标
        const mertial5 = new LineBasicMaterial({color: 0xff5500});
        // 三维直线LineCurve3
        const LineCurve = new LineCurve3(p1, p2);
        const pointArr = LineCurve.getPoints(5);
        geometry5.setFromPoints(pointArr);
        const line3 = new Line(geometry5, mertial5);
        scene.add(line3);


        const geometry6 = new BufferGeometry();
        const mertial6 = new LineBasicMaterial({color: 0xffffff});
        // 贝塞尔曲线， 样条曲线
        const p11 = new Vector3(-8, 0, 0);
        const p22 = new Vector3(-4, 10, 0);
        const p33 = new Vector3(4, 10, 0);
        const p44 = new Vector3(8, 0, 0);
        // 三维三次贝赛尔曲线
        const curve = new CubicBezierCurve3(p11, p22, p33, p44);
        const pointsArr2 = curve.getPoints(50);
        geometry6.setFromPoints(pointsArr2);
        const line4 = new Line(geometry6, mertial6);
        scene.add(line4);

        // 样条曲线
        //创建管道成型的路径(3D样条曲线)
        const path = new CatmullRomCurve3([
            new Vector3(0, 0, 0),
            new Vector3(10, 0, 0),
            new Vector3(0, 10, 0),
            new Vector3(10, 10, 10)
        ]);
        // path:路径   40：沿着轨迹细分数  2：管道半径   25：管道截面圆细分数
        const geometry7 = new TubeGeometry(path, 40, 2, 25);
        const mertial7 = new LineBasicMaterial({color: 0x999999});
        const line5 = new Line(geometry7, mertial7);
        scene.add(line5);


        /**
         * 创建旋转网格模型
         */
        const shape = new Shape();
        const points3 = [
            new Vector2(2,20),
            new Vector2(10,25),
            new Vector2(25,30)
        ];
        shape.splineThru(points3);
        const splinePoints = shape.getPoints(20);
        const geometry8 = new LatheGeometry(splinePoints,50);
        const material8=new MeshPhongMaterial({
            color: 0xf188a1,//三角面颜色
            side: DoubleSide //两面可见
        });//材质对象

        material8.wireframe = true;//线条模式渲染(查看细分数)
        const mesh = new Mesh(geometry8, material8);//旋转网格模型对象
        scene.add(mesh);//旋转网格模型添加到场景中

        // 通过顶点定义轮廓
        const shape4 = new Shape();
        // shape可以理解为一个需要填充轮廓
        shape4.absarc(0, 0, 20, 0, 2 * Math.PI, false);
        // 所谓填充：ShapeGeometry算法利用顶点计算出三角面face3数据填充轮廓
        // curveSegments  将圆弧分为几段
        const geometry9 = new ShapeGeometry(shape4, 10);
        const material9=new MeshPhongMaterial({
            color: 0x008811,//三角面颜色
            side: DoubleSide //两面可见
        });//材质对象
        material9.wireframe = true;
        const mesh3 = new Mesh(geometry9, material9);
        // scene.add(mesh3);


        // 孔
        const R = 30
        const shape5 = new Shape();
        shape5.arc(-50, 0, R, 0, 2 * Math.PI, false);
        const path1 = new Path();
        const path2 = new Path();
        path1.arc(-60, 0, R / 5, 0, 2 * Math.PI, false);
        path2.arc(-40, 0, R / 5, 0, 2 * Math.PI, false);
        shape5.holes.push(path1, path2);
        const geometry10 = new ShapeGeometry(shape5, 50);
        const material10 = new MeshPhongMaterial({
            color: 0x5577ff,
            side: DoubleSide
        });
        // material10.wireframe = true;
        const mesh4 = new Mesh(geometry10, material10);
        scene.add(mesh4);





        renderer.render(scene, camera);
    }
}
