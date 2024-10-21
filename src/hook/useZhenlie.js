import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function useZhenlie() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const gui = new GUI();
    //改变交互界面style属性
    gui.domElement.style.right = "0px";
    gui.domElement.style.width = "300px";
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    // const geometry = new THREE.PlaneGeometry(100, 50);
    //材质对象Material
    // const material = new THREE.MeshLambertMaterial({
    //   color: 0x00ffff, //设置材质颜色
    //   transparent: true, //开启透明
    //   opacity: 0.5, //设置透明度
    //   side: THREE.DoubleSide // 二维的方能使用
    // });
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      shininess: 20, //高光部分的亮度，默认30
      specular: 0x444444, //高光部分的颜色
    });
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
        // 在XOZ平面上分布
        mesh.position.set(i * 200, 0, j * 200);
        scene.add(mesh); //网格模型添加到场景中
      }
    }
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
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    console.log("ambient.intensity", ambient.intensity);
    // 通过GUI改变mesh.position对象的xyz属性
    gui
      .add(ambient, "intensity", 0, 2.0)
      .name("环境光强度")
      .step(0.1)
      .onChange((val) => {
        if (ambient.intensity === 1.0) {
          console.log("中间值到了 === ");
        }
      });
    // const pointLight = new THREE.PointLight(0xffffff, 1.0);
    // pointLight.position.set(800, 800, 800);
    // scene.add(pointLight);
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
