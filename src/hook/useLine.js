import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function useLine() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const width = window.innerWidth; //宽度
    const height = window.innerHeight; //高度
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 8000);
    camera.position.set(0, 0, 100);
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
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    console.log("ambient.intensity", ambient.intensity);
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

    const material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    })

    const points = [];
    console.log("vector 3 = ", new THREE.Vector3(-10, 0, 0))
    points.push(new THREE.Vector3(-10, 0, 0))
    points.push(new THREE.Vector3(0, 10, 0))
    points.push(new THREE.Vector3(10, 0, 0))

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line)

    return () => {
      document.body.removeChild(renderer.domElement);
    };
  });
}
