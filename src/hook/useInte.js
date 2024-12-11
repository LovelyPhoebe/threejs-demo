import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import dogPng from "../static/dog.png";
const generateColoredPointCloud = (pointNumber, width, height) => {
  const pointCloud = [];
  for (let index = 0; index < pointNumber; index++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const z = Math.random() * 50; // 修改 z 坐标范围
    const r = Math.random() * 256;
    const g = Math.random() * 256;
    const b = Math.random() * 256;
    pointCloud.push({ x, y, z, color: { r, g, b } });
  }
  return pointCloud;
};
export function useInte() {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const renderRef = useRef();
  useEffect(() => {
    // 生成3d内容添加到容器内
    // 创建场景
    sceneRef.current = new THREE.Scene();
    const w = window.innerWidth;
    const h = window.innerHeight;
    // 创建相机
    const cameraFov = 75; // 视场角度，通常为 75 适合大多数情况
    const aspectRatio = window.innerWidth / window.innerHeight;
    const cameraNear = 0.1; // 最近剪裁平面
    const cameraFar = 10000; // 最远剪裁平面

    cameraRef.current = new THREE.PerspectiveCamera(
      cameraFov,
      aspectRatio,
      cameraNear,
      cameraFar
    );
    // 设置相机位置，使其能够完整看到整个平面
    // 因为平面宽度为500，高度为1000，所以我们需要调整相机的z轴，使得它能覆盖整个平面
    const cameraDistance =
      Math.max(w, h) / (2 * Math.tan(THREE.MathUtils.degToRad(cameraFov / 2)));
    // 创建点云几何体
    const geometry = new THREE.BufferGeometry();
    // 创建点云数据
    const pointCloud = generateColoredPointCloud(1999, w, h);
    console.log("pointCloud = ", pointCloud);
    // 解析点云数据
    const vertices = [];
    const colors = [];
    pointCloud.forEach((point) => {
      vertices.push(point.x, point.y, point.z);
      colors.push(
        point.color.r / 255,
        point.color.g / 255,
        point.color.b / 255
      );
    });
    // 几何体添加属性
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    // 创建材质
    const meterial = new THREE.PointsMaterial({
      size: 3,
      color: 0xffff00,
      vertexColors: true,
    });
    // 创建点云对象
    const points = new THREE.Points(geometry, meterial);
    sceneRef.current.add(points);

    // 光源 平行光
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    sceneRef.current.add(ambient);
    // 添加渲染器
    renderRef.current = new THREE.WebGLRenderer({
      antialias: true, // 抗锯齿
    });
    renderRef.current.render(sceneRef.current, cameraRef.current);
    renderRef.current.setClearColor(0x444444, 1);
    renderRef.current.setSize(w, h);
    const axesHelper = new THREE.AxesHelper(150);
    sceneRef.current.add(axesHelper);
    document.body.appendChild(renderRef.current.domElement);

    // 添加操作
    const controls = new OrbitControls(
      cameraRef.current,
      renderRef.current.domElement
    );
    controls.addEventListener("change", () => {
      renderRef.current.render(sceneRef.current, cameraRef.current);
    });

    // 创建纹理
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(dogPng, (loadedTexture) => {
      // 获取图片宽高
      const imageWidth = loadedTexture.image.width;
      const imageHeight = loadedTexture.image.height;
      console.log("Image width:", imageWidth, "Image height:", imageHeight);

      // 创建平面几何体并应用纹理
      const planeGeometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, // 如果图片有透明区域，保持透明
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.set(imageWidth / 2, imageHeight / 2, 0); // 设置平面位置为 z = 0
      sceneRef.current.add(plane);

      // 设置相机位置俯视
      cameraRef.current.position.set(
        imageWidth / 2,
        imageHeight / 2,
        cameraDistance
      );
      cameraRef.current.lookAt(imageWidth / 2, imageHeight / 2, 0);

      controls.target.set(imageWidth / 2, imageHeight / 2, 0);
      controls.update(); // 确保控件生效
    });
    const animate = function () {
      requestAnimationFrame(animate);
      renderRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate(); // 启动动画循环

    window.onresize = function () {
      renderRef.current.setSize(window.innerWidth, window.innerHeight);
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
    };
    return () => {
      document.body.removeChild(renderRef.current.domElement);
    };
  });
}
