
import * as THREE from "three";
import { useEffect } from "react";
// 引入轨道控制器扩展库OrbitControls.js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function useBase() {
    useEffect(() => {
        // 创建场景
        const scene = new THREE.Scene();
        // 长方体
        const geometry = new THREE.BoxGeometry(100, 100, 100);
        // 材料 MeshBasicMaterial不受光照影响
        // const material = new THREE.MeshBasicMaterial({
        //   // color: 0xff0000
        //   color: 0x0000ff, //设置材质颜色
        //   transparent: true, //开启透明
        //   opacity: 0.5, //设置透明度
        // });
        //MeshLambertMaterial受光照影响
        const material = new THREE.MeshLambertMaterial();
        // 实体
        const mesh = new THREE.Mesh(geometry, material);
        //设置网格模型在三维空间中的位置坐标，默认是坐标原点
        mesh.position.set(0, 10, 0);
        scene.add(mesh);
    
        // 透视投影相机
        // const camera = new THREE.PerspectiveCamera();
        // 定义相机输出画布的尺寸(单位:像素px)
        const width = window.innerWidth; //宽度
        const height = window.innerHeight; //高度
        const camera = new THREE.PerspectiveCamera(30, width / height, 1, 3000);
        // 根据需要设置相机位置具体值
        camera.position.set(200, 200, 200);
        // 相机看向哪里
        camera.lookAt(mesh.position); // 指向mesh
        // camera.lookAt(0, 10, 0);  //y轴上位置10
    
        // 渲染器
        const renderer = new THREE.WebGLRenderer();
        // 输出画布的尺寸
        renderer.setSize(width, height);
        // 执行渲染操作
        renderer.render(scene, camera);
        // // AxesHelper：辅助观察的坐标系
        const axesHelper = new THREE.AxesHelper(150);
        scene.add(axesHelper);
    
        //点光源：两个参数分别表示光源颜色和光照强度
        // 参数1：0xffffff是纯白光,表示光源颜色
        // 参数2：1.0,表示光照强度，可以根据需要调整
        const pointLight = new THREE.PointLight(0xffffff, 1.0);
        // pointLight.intensity = 1.0;//光照强度
        // pointLight.decay = 0.0;//设置光源不随距离衰减
        //点光源位置
        // pointLight.position.set(400, 0, 0);//点光源放在x轴上
        pointLight.position.set(400, 200, 300);
        // pointLight.position.set(-400, -200, -300);
        // pointLight.position.set(100, 60, 50);
        // scene.add(pointLight); //点光源添加到场景中
    
        //环境光:没有特定方向，整体改变场景的光照明暗
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        // scene.add(ambient);
    
        // 平行光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        // 设置光源的方向：通过光源position属性和目标指向对象的position属性计算
        directionalLight.position.set(80, 100, 50);
        // 方向光指向对象网格模型mesh，可以不设置，默认的位置是0,0,0
        directionalLight.target = mesh;
        // 对比不同入射角，mesh表面对光照的反射效果
        // directionalLight.position.set(100, 0, 0);
        // directionalLight.position.set(0, 100, 0);
        // directionalLight.position.set(100, 100, 100);
        // directionalLight.position.set(100, 60, 50);
        scene.add(directionalLight);
    
        // .domElement本质上就是一个HTML元素：Canvas画布。
        document.body.appendChild(renderer.domElement);
    
        // 设置相机控制轨道控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        // 如果OrbitControls改变了相机参数，重新调用渲染器渲染三维场景
        controls.addEventListener("change", () => {
          renderer.render(scene, camera);
        });
    
        // 动画循环
        const animate = function () {
          requestAnimationFrame(animate);
          mesh.rotateY(0.01); //每次绕y轴旋转0.01弧度
          renderer.render(scene, camera);
        };
    
        animate(); // 启动动画循环
        // onresize 事件会在窗口被调整大小时发生
        window.onresize = function () {
          // 重置渲染器输出画布canvas尺寸
          renderer.setSize(window.innerWidth, window.innerHeight);
          // 全屏情况下：设置观察范围长宽比aspect为窗口宽高比
          camera.aspect = window.innerWidth / window.innerHeight;
          // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
          // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
          // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
          camera.updateProjectionMatrix();
        };
    
        // 清理函数
        return () => {
          document.body.removeChild(renderer.domElement);
        };
      }, []);
}