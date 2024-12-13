import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import earcut from "earcut";

export function useDrawPolygon({ topDown, rotate }) {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const renderRef = useRef();
  const raycasterRef = useRef(); // 射线投射器
  const pointer = new THREE.Vector2(); // 鼠标位置
  const controlsRef = useRef();
  const planeRef = useRef(); // 基准平面
  const [points, setPoints] = useState([]); // 存储多边形顶点
  const lineRef = useRef();
  const guiRef = useRef();
  const isTopDownRef = useRef();
  const size = 500;
  const gridRef = useRef();
  const faceRef = useRef();
  const shapeRef = useRef();
  const selectRef = useRef();

  const initGrid = () => {
    const gridDivision = 50;
    const gridColor = 0x888888; // 网格颜色
    gridRef.current = new THREE.GridHelper(size, gridDivision, gridColor);
    sceneRef.current.add(gridRef.current);
    // 旋转到xz平面
    gridRef.current.rotation.x = Math.PI / 2;
    gridRef.current.material.opacity = 0.2; // 设置网格透明度为0.5，可根据实际情况调整该值
    gridRef.current.material.transparent = true; // 开启透明属性
  };

  // 计算面的中心点
  const calculateCenter = (vertices) => {
    const center = new THREE.Vector3();
    vertices.forEach((vertex) => {
      center.add(vertex); // 累加所有顶点
    });
    center.divideScalar(vertices.length); // 求平均值
    return center;
  };

  const getRotatedVertices = (vertices, center, angle) => {
    const angleInRadians = THREE.MathUtils.degToRad(angle); // 将角度转为弧度
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);

    const newVertices = [];

    vertices.forEach((vertex) => {
      // 将顶点平移到以中心点为原点
      const translatedX = vertex.x - center.x;
      const translatedY = vertex.y - center.y;

      // 应用旋转矩阵
      const rotatedX = translatedX * cos - translatedY * sin;
      const rotatedY = translatedX * sin + translatedY * cos;

      // 平移回原位置
      const x = rotatedX + center.x;
      const y = rotatedY + center.y;

      // z 坐标保持不变
      newVertices.push(new THREE.Vector3(x, y , 0))
    });
    return newVertices;
  };

  // 辅助函数，用于计算两点在平面上的距离（这里简单以二维平面距离计算为例，可根据实际需求调整更精准的空间距离计算方式）
  const calculate2DDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    if (rotate && selectRef.current) {
        const positionArr = selectRef.current.geometry.attributes.position.array;
        const vertices = [];
        for (let i = 0; i < positionArr.length; i += 3) {
          const x = positionArr[(i / 3)* 3];
          const y = positionArr[(i / 3)* 3 + 1];
          const z = positionArr[(i /3)* 3 + 2];
          vertices.push(new THREE.Vector3(x, y, z));
        }
        const center = calculateCenter(vertices);
        const newVertices = getRotatedVertices(vertices, center, rotate);
        drawPolygon(newVertices);
    }
  }, [rotate]);

  // 控制2d 3d是否可编辑
  useEffect(() => {
    isTopDownRef.current = topDown;
    if (topDown) {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 1000); // 设置在 Top-Down 视角
        cameraRef.current.lookAt(0, 0, 0);
      }
    } else {
      if (!controlsRef.current) {
        // 添加控制器
        controlsRef.current = new OrbitControls(
          cameraRef.current,
          renderRef.current?.domElement
        );
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        controlsRef.current.addEventListener("change", () => {
          renderRef.current.render(sceneRef.current, cameraRef.current);
        });
      }
    }
  }, [topDown]);

  useEffect(() => {
    guiRef.current = new GUI();
    //改变交互界面style属性
    guiRef.current.domElement.style.right = "0px";
    guiRef.current.domElement.style.width = "300px";
    // 创建射线
    raycasterRef.current = new THREE.Raycaster();
    // 创建场景
    sceneRef.current = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;

    // 创建相机
    cameraRef.current = new THREE.PerspectiveCamera(75, w / h, 0.1, 10000);
    cameraRef.current.position.set(0, 0, 1000); // 设置在 Top-Down 视角
    cameraRef.current.lookAt(0, 0, 0);

    // 创建渲染器
    renderRef.current = new THREE.WebGLRenderer({ antialias: true });
    renderRef.current.setSize(w, h);
    renderRef.current.setClearColor(0x444444, 1);
    document.body.appendChild(renderRef.current.domElement);

    // 坐标系
    const axesHelper = new THREE.AxesHelper(size / 2);
    sceneRef.current.add(axesHelper);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    // 创建辅助平面 (z=0)
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0,
    });
    planeRef.current = new THREE.Mesh(planeGeometry, planeMaterial);
    planeRef.current.visible = true;
    sceneRef.current.add(planeRef.current);

    initGrid();

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      renderRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // 窗口大小调整
    window.onresize = () => {
      renderRef.current.setSize(window.innerWidth, window.innerHeight);
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    // 鼠标事件监听
    const onClick = (event) => {
      if (!isTopDownRef.current) return;
      // 计算鼠标在屏幕上的归一化坐标
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      console.log("click = ", event);

      // 检查是否点击到面(多面，此只选0)
      const faces = sceneRef.current.children.filter(
        (obj) => obj.userData.type === "face"
      );
      const faceIntersects = raycasterRef.current.intersectObjects(faces);

      // 如果点击到了面，打印该面的信息
      if (faceIntersects.length > 0) {
        const intersectedFace = faceIntersects[0]?.object;
        console.log("Clicked face: ", intersectedFace.userData, faces);
        selectRef.current = faces[0];
        const position = faces[0].geometry.attributes.position;
        console.log("Clicked position: ", position);
        return;
      }
      // 投射到平面上
      raycasterRef.current.setFromCamera(pointer, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(planeRef.current);
      console.log("intersects = ", intersects);
      if (intersects.length > 0) {
        const point = intersects[0].point; // 获取交点
        setPoints((prevPoints) => {
          const updatedPoints = [...prevPoints, point];
          // threejs生成面不需要自行判断闭合点,此逻辑可以先行不用
          //   const currentLength = updatedPoints.length;
          //   if (currentLength >= 2) {
          //     const firstPoint = updatedPoints[0];
          //     const lastPoint = updatedPoints[currentLength - 1];
          //     const distance = calculate2DDistance(lastPoint, firstPoint);
          //     if (distance <= 10) {
          //       // 如果距离小于等于10像素，让最后一个点坐标等于第一个点坐标，实现闭合
          //       updatedPoints[currentLength - 1] = {
          //         ...firstPoint,
          //       };
          //     }
          //   }
          return updatedPoints; // 更新顶点列表
        });
      }
    };

    // 鼠标右键点击事件监听，用于清空points并取消绘制
    const onRightClick = (event) => {
      if (event.button === 2) {
        setPoints([]);
      }
    };

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // 阻止默认右键菜单弹出
      onRightClick(e);
    });

    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("contextmenu", (e) => onRightClick(e));
      document.body.removeChild(renderRef.current.domElement);
    };
  }, []);

  useEffect(() => {
    console.log("points = ", points);
    drawPolygon(points); // 更新多边形
  }, [points]);

  const drawFaceByEarCut = (vertices) => {
    if (vertices.length <= 2) return;
    const flatVertices = vertices.reduce(
      (acc, vertex) => acc.concat([vertex.x, vertex.y]),
      []
    );
    const indices = earcut(flatVertices); // 获取顶点索引

    //   console.log("indices = ", indices);
    //   console.log("flatVertices = ", flatVertices);

    const positionArray = new Float32Array((flatVertices.length * 3) / 2); // 获取一个三维点位的数组（填充z）
    for (let i = 0; i < flatVertices.length; i += 2) {
      positionArray[(i / 2) * 3] = flatVertices[i];
      positionArray[(i / 2) * 3 + 1] = flatVertices[i + 1];
      positionArray[(i / 2) * 3 + 2] = 0; // z平面
    }
    // console.log("positionArray = ", positionArray);

    const faceGeometry = new THREE.BufferGeometry();
    faceGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
    faceGeometry.setIndex(indices);
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: "0xff0000",
      side: THREE.DoubleSide,
    });
    faceRef.current = new THREE.Mesh(faceGeometry, faceMaterial);
    faceRef.current.userData.type = "face";
    sceneRef.current.add(faceRef.current);
  };

  const drawFaceByShape = (vertices) => {
    if (vertices.length <= 2) return;
    shapeRef.current = new THREE.Shape();
    // 起始点
    shapeRef.current.moveTo(vertices[0].x, vertices[0].y);
    // 连接其他点
    for (let i = 1; i < vertices.length; i++) {
      shapeRef.current.lineTo(vertices[i].x, vertices[i].y);
    }

    // 闭合路径
    shapeRef.current.closePath();
    // 创建一个Geometry并填充颜色
    const geometry = new THREE.ShapeGeometry(shapeRef.current); // 创建面
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000, // 填充颜色
      side: THREE.DoubleSide, // 双面显示
      transparent: true,
      opacity: 0.5, // 设置透明度
    });

    faceRef.current = new THREE.Mesh(geometry, material);
    faceRef.current.userData.type = "face";
    sceneRef.current.add(faceRef.current);
  };

  // 绘制多边形
  const drawPolygon = (vertices) => {
    // 清除之前的多边形
    sceneRef.current.children = sceneRef.current.children.filter(
      (obj) => obj.type !== "Mesh"
    );
    // 绘制点
    vertices.forEach((vertex) => {
      console.log("vertex = ", vertex, vertex.x);
      const pointGeometry = new THREE.SphereGeometry(5, 16, 16); // 小球表示点
      const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // 黄色材质
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      pointMesh.position.set(vertex.x, vertex.y, vertex.z);
      pointMesh.userData.type = "point"; // 标记为点
      sceneRef.current.add(pointMesh);
    });

    // 绘制线
    if (vertices.length < 2) return;
    // console.log("vertices = ", vertices);

    const lineMaterial = new THREE.LineBasicMaterial({ color: "0xffffff" });
    const planeVerticles = vertices.map(
      (vertice) => new THREE.Vector2(vertice.x, vertice.y)
    );
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      planeVerticles
    );
    lineRef.current = new THREE.Line(lineGeometry, lineMaterial);
    sceneRef.current.add(lineRef.current);

    // 创建面的几何体
    //   drawFaceByEarCut(vertices);
    drawFaceByShape(vertices);
    console.log("sceneRef.current = ", sceneRef.current.children);
  };
}
