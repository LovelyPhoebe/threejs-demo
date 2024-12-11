import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function useBufferGeom() {
  useEffect(() => {
    const scene = new THREE.Scene();
    //创建一个空的几何体对象
    const geometry = new THREE.BufferGeometry(); 
    const vertices = new Float32Array([
        0, 0, 0, //顶点1坐标
        50, 0, 0, //顶点2坐标
        0, 100, 0, //顶点3坐标
        0, 0, 10, //顶点4坐标
        0, 0, 100, //顶点5坐标
        50, 0, 10, //顶点6坐标
    ]);
    const attribute = new THREE.BufferAttribute(vertices, 3);
    console.log("attribute = ", attribute)
    // 设置几何体attributes属性的位置属性
    geometry.attributes.position = attribute;

    // 点渲染模式
    const material = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 5 //点对象像素尺寸
    }); 

    const mesh = new THREE.Points(geometry, material)
    scene.add(mesh)

    // 线渲染模式
    // const material = new THREE.LineBasicMaterial({
    //     color: 0xff0000 //线条颜色
    // })
    // const line = new THREE.Line(geometry, material)
    // scene.add(line)
    const width = window.innerWidth; //宽度
    const height = window.innerHeight; //高度
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 8000);
    // camera.position.set(292, 223, 185);
    //在原来相机位置基础上拉远，可以观察到更大的范围
    // 改变相机观察目标点
    // camera.lookAt(1000, 0, 1000);

    camera.position.set(800, 800, 800);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    // 设置背景颜色
    renderer.setClearColor(0x444444, 1);
    renderer.setSize(width, height);
    renderer.render(scene, camera);
    const axesHelper = new THREE.AxesHelper(150);
    scene.add(axesHelper);
    // const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    // scene.add(ambient);
    // console.log("ambient.intensity", ambient.intensity);
    const pointLight = new THREE.PointLight(0xffffff, 1.0);
    pointLight.position.set(800, 800, 800);
    scene.add(pointLight);
    document.body.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener("change", () => {
      renderer.render(scene, camera);
    });

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate(); // 启动动画循环

    window.onresize = function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    console.log("查看当前屏幕设备像素比", window.devicePixelRatio);
    return () => {
      document.body.removeChild(renderer.domElement);
    };
  });
}
