import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import earcut from "earcut";
import { Layer } from "../layer/Layer";
import { LayerManager } from "../layer/LayerManager";
import { Shape } from "../layer/Shape";
import mapPng from "../assets/map.png";
import { message } from "antd";

/**
 * depthWrite !!!非常重要，所有在z为0平面显示的都要解决深度冲突
 */

const gridHeight = 401;
const gridWidth = 884;
const cameraFov = 90;
const planeSize = (Math.max(gridWidth, gridHeight) / 100 + 1) * 200;
const oriCameraHeight =
  Math.max(gridWidth, gridHeight) /
  (2 * Math.tan(THREE.MathUtils.degToRad(cameraFov / 2)));
const cameraNear = oriCameraHeight / 5;
const cameraFar = Math.sqrt(gridWidth ** 2 + gridHeight ** 2) + oriCameraHeight;

export function useDrawPolygon({ topDown, rad, isDrag, isWheel, curLayer }) {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const renderRef = useRef();
  const raycasterRef = useRef(); // 射线投射器
  const pointerRef = useRef(new THREE.Vector2()); // 鼠标位置
  const controlsRef = useRef();
  const planeRef = useRef(); // 基准平面
  const pointsRef = useRef([]); // 存储多边形顶点
  const guiRef = useRef();
  const isTopDownRef = useRef();
  const gridRef = useRef();
  const faceRef = useRef();
  const shapeRef = useRef();
  const selectRef = useRef();
  const isDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isWheelRef = useRef(false);
  const mouseRef = useRef();
  const geometry0Ref = useRef();
  const modifyGeometry = useRef(); // 存储内容为bufferAttribute
  const edgeRef = useRef();
  const wallRef = useRef();
  const slopeRef = useRef();
  const managerRef = useRef();
  const currentLayerRef = useRef();
  const snapFeatureRef = useRef();

  const changeCurLayer = (curLayer) => {
    currentLayerRef.current = managerRef.current?.selectLayer(curLayer);
    planeRef.current = currentLayerRef.current?.getBasePlane() || null;
  };

  useEffect(() => {
    changeCurLayer(curLayer);
    selectRef.current = null;
  }, [curLayer]);

  const initGrid = () => {
    const gridDivision = 50;
    const gridColor = 0x888888; // 网格颜色
    gridRef.current = new THREE.GridHelper(planeSize, gridDivision, gridColor);
    sceneRef.current.add(gridRef.current);
    // 旋转到xz平面
    gridRef.current.rotation.x = Math.PI / 2;
    gridRef.current.material.opacity = 0.2; // 设置网格透明度为0.5，可根据实际情况调整该值
    gridRef.current.material.transparent = true; // 开启透明属性
  };

  useEffect(() => {
    isWheelRef.current = isWheel;
  }, [isWheel]);

  // 计算面的中心点
  const calculateCenter = (vertices) => {
    const center = new THREE.Vector3();
    vertices.forEach((vertex) => {
      center.add(vertex); // 累加所有顶点
    });
    center.divideScalar(vertices.length); // 求平均值
    return center;
  };

  const rotatedVertices = (vertices, center, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    vertices.forEach((vertex) => {
      // 将顶点平移到以中心点为原点
      const translatedX = vertex.x - center.x;
      const translatedY = vertex.y - center.y;

      // 应用旋转矩阵
      const rotatedX = translatedX * cos - translatedY * sin;
      const rotatedY = translatedX * sin + translatedY * cos;

      // 平移回原位置
      vertex.x = rotatedX + center.x;
      vertex.y = rotatedY + center.y;
    });
  };

  // 辅助函数，用于计算两点在平面上的距离（这里简单以二维平面距离计算为例，可根据实际需求调整更精准的空间距离计算方式）
  const calculate2DDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const positions2Vertices = (positionArr) => {
    const vertices = [];
    for (let i = 0; i < positionArr.length; i += 3) {
      const x = positionArr[i];
      const y = positionArr[i + 1];
      const z = positionArr[i + 2];
      vertices.push(new THREE.Vector3(x, y, z));
    }
    return vertices;
  };

  useEffect(() => {
    if (rad && selectRef.current) {
      const positionArr = selectRef.current.geometry.attributes.position.array;
      const vertices = positions2Vertices(positionArr);
      const center = calculateCenter(vertices);
      // 这是多边形的边界圆的圆心
      // const center = selectRef.current.geometry.boundingSphere.center
      const pointMesh = generatePoint(center);
      sceneRef.current.add(pointMesh);
      rotatedVertices(vertices, center, rad);
      drawPolygon(vertices);
    }
  }, [rad]);

  // 控制2d 3d是否可编辑
  useEffect(() => {
    isTopDownRef.current = topDown;
    if (topDown) {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.position.set(
          gridWidth / 2,
          gridHeight / 2,
          oriCameraHeight
        ); // 设置在 Top-Down 视角
        cameraRef.current.lookAt(gridWidth / 2, gridHeight / 2, 0);
      }
    } else {
      if (!controlsRef.current) {
        // 添加控制器
        controlsRef.current = new OrbitControls(
          cameraRef.current,
          renderRef.current?.domElement
        );
        controlsRef.current.target.set(gridWidth / 2, gridHeight / 2, 0);
        controlsRef.current.update();
        cameraRef.current.lookAt(gridWidth / 2, gridHeight / 2, 0);
        controlsRef.current.addEventListener("change", () => {
          renderRef.current.render(sceneRef.current, cameraRef.current);
        });
      }
    }
  }, [topDown]);

  useEffect(() => {
    isDragRef.current = isDrag;
  }, [isDrag]);

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

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      mapPng, // 替换为你的 PNG 文件路径
      (texture) => {
        // 创建平面几何体
        const geometry = new THREE.PlaneGeometry(gridWidth, gridHeight); // 平面大小为 2x2
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          depthTest: false, // 禁止深度测试
        });

        // 创建平面网格对象
        const map = new THREE.Mesh(geometry, material);
        map.userData.type = "map";
        map.position.set(gridWidth / 2, gridHeight / 2, 0); // 将平面放置到 z=0
        // 防止多次渲染
        if (
          sceneRef.current.children.findIndex(
            (obj) => obj.userData.type === "map"
          ) === -1
        ) {
          sceneRef.current.add(map);
        }
      },
      undefined,
      (error) => {
        console.error("纹理加载失败：", error);
      }
    );
    // 创建相机
    cameraRef.current = new THREE.PerspectiveCamera(
      cameraFov,
      gridWidth / gridHeight,
      cameraNear,
      cameraFar
    );
    cameraRef.current.position.set(
      gridWidth / 2,
      gridHeight / 2,
      oriCameraHeight
    ); // 设置在 Top-Down 视角
    cameraRef.current.lookAt(gridWidth / 2, gridHeight / 2, 0);

    // 创建渲染器
    renderRef.current = new THREE.WebGLRenderer({ antialias: true });
    renderRef.current.setSize(w, h);
    renderRef.current.setClearColor(0x444444, 1);
    document.body.appendChild(renderRef.current.domElement);

    // 坐标系
    const axesHelper = new THREE.AxesHelper(planeSize / 2);
    sceneRef.current.add(axesHelper);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    wallRef.current = new Layer({
      name: "wall",
      color: 0xffff00,
      scene: sceneRef.current,
    });
    slopeRef.current = new Layer({
      name: "slope",
      color: 0xff00ff,
      scene: sceneRef.current,
    });
    managerRef.current = new LayerManager();
    // 创建辅助平面 (z=0)
    // 虚拟墙基准面
    const wallGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const wallMaterial = new THREE.MeshBasicMaterial({
      // color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    const isBasePlane = true;
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    const wallShape = new Shape(wallMesh, isBasePlane);
    wallRef.current.addObject(wallShape);
    managerRef.current.addLayer(wallRef.current);
    // 斜坡基准面
    const slopeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const slopeMaterial = new THREE.MeshBasicMaterial({
      // color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    const slopeMesh = new THREE.Mesh(slopeGeometry, slopeMaterial);
    const slopeShape = new Shape(slopeMesh, isBasePlane);
    slopeRef.current.addObject(slopeShape);
    managerRef.current.addLayer(slopeRef.current);
    console.log("managerRef.current = ", managerRef.current);

    changeCurLayer("wall");

    console.log("sceneRef.current", sceneRef.current.children);
    console.log("plane currrent = ", planeRef.current);
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
      cameraRef.current.aspect = gridWidth / gridHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    const calculateRaycaster = (event) => {
      // 更新鼠标位置
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      // 计算鼠标移动的距离
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
    };

    // 鼠标滚轮事件监听，用于缩放
    const onWheel = (event) => {
      // 判断是否已经选中对象
      if (!selectRef.current && !isWheelRef.current) return;
      console.log("event = ", event);

      // 根据滚轮的方向来调整缩放比例
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1; // 滚动向下缩小，滚动向上放大

      // 获取当前的缩放值并应用新的缩放因子
      selectRef.current.scale.x *= scaleFactor;
      selectRef.current.scale.y *= scaleFactor;
      selectRef.current.scale.z *= scaleFactor;

      // 更新物体的缩放
      selectRef.current.updateMatrix(); // 更新物体的矩阵
    };

    const onZoomWheel = (event) => {
      event.preventDefault();

      // 缩放因子
      const delta = event.deltaY > 0 ? 0.95 : 1.05;
      const newHeight = cameraRef.current.position.z * delta;
      if (newHeight >= cameraNear && newHeight <= cameraFar) {
        cameraRef.current.position.z = newHeight;
      }
    };

    const onMouseDown = (event) => {
      if (!selectRef.current) return;
      if (!isWheelRef.current && !isDragRef.current) return;
      calculateRaycaster(event);
      const planeIntersects = raycasterRef.current.intersectObject(
        planeRef.current
      );
      // 如果点击到了面，打印该面的信息
      if (planeIntersects?.length > 0) {
        console.log("planeIntersects = ", planeIntersects);
        const planeObject = planeIntersects[0].object;
        const point = planeIntersects[0].point;
        console.log("Clicked object: ", planeObject);
        const position = selectRef.current.geometry.attributes.position;
        console.log("select current position: ", position);
        mouseRef.current = new THREE.Vector3(point.x, point.y, 0);
        console.log("current click mouse = ", mouseRef.current);
        isDraggingRef.current = true;
      }
    };

    // 拖拽鼠标监听
    const onMouseMove = (event) => {
      calculateRaycaster(event);
      snapFeatureRef.current?.material.color.set(currentLayerRef.current.color);
      // 滑动鼠标的时候判断是否滚动过某元素
      const intersectMeshs = raycasterRef.current.intersectObjects(
        currentLayerRef.current.getFeatures()
      );
      if (intersectMeshs[0]) {
        snapFeatureRef.current = intersectMeshs[0]?.object;
        snapFeatureRef.current.material.color.set(0xff0000);
      }
      if (!selectRef.current) return;
      // 增加吸附和高亮
      const intersects = raycasterRef.current.intersectObject(planeRef.current);
      // 清除之前的鼠标点
      sceneRef.current.children = sceneRef.current.children.filter((obj) => {
        return !obj.userData.isPointer;
      });
      if (intersects.length <= 0) return;
      // 增加鼠标滑动高亮鼠标点
      const point = intersects[0].point;
      const pointer = generatePoint(point, true);
      sceneRef.current.add(pointer);
      // TODO:如果抓到多边形点则吸附
      if (!isDragRef.current && !isWheelRef.current) return;
      if (!isDraggingRef.current) return;
      const newPoint = new THREE.Vector3(point.x, point.y, 0); // 获取新的交点
      if (isDragRef.current) {
        const delta = newPoint.sub(mouseRef.current); // 计算偏移量
        console.log("delta = ", delta);
        selectRef.current.geometry.translate(delta.x, delta.y, delta.z);
        selectRef.current.geometry.attributes.position.needsUpdate = true;
      } else if (isWheelRef.current) {
        // 旋转 + 缩放
        console.log("旋转 + 缩放");
        const positionArr =
          selectRef.current.geometry.attributes.position.array;
        const vertices = positions2Vertices(positionArr);
        const center = calculateCenter(vertices);

        // 获取当前鼠标位置和上一个鼠标位置的向量
        const lastMousePos = mouseRef.current;
        const mouseDirection = new THREE.Vector2(
          newPoint.x - center.x,
          newPoint.y - center.y
        );
        const lastMouseDirection = new THREE.Vector2(
          lastMousePos.x - center.x,
          lastMousePos.y - center.y
        );
        // 计算旋转角度
        const angle = mouseDirection.angle() - lastMouseDirection.angle();
        console.log("旋转角度：", angle);
        // 计算缩放比例
        const scaleFactor =
          mouseDirection.length() / lastMouseDirection.length();
        console.log("缩放比例：", scaleFactor);
        // 应用旋转
        rotatedVertices(vertices, center, angle); // 旋转顶点
        // 应用缩放
        vertices.forEach((vertex) => {
          vertex.sub(center); // 向量减去中心点
          vertex.multiplyScalar(scaleFactor); // 缩放
          vertex.add(center); // 重新加回中心点
        });
        // 将新的顶点数据更新到几何体
        for (let i = 0; i < vertices.length; i++) {
          positionArr[i * 3] = vertices[i].x;
          positionArr[i * 3 + 1] = vertices[i].y;
          positionArr[i * 3 + 2] = vertices[i].z;
        }
        // 更新几何体
        selectRef.current.geometry.attributes.position.needsUpdate = true;
      }
      // 存储新的鼠标位置
      mouseRef.current = new THREE.Vector3(point.x, point.y, 0);
    };

    const onMouseUp = () => {
      if (isDragRef.current && isDraggingRef.current) {
        isDraggingRef.current = false;
      }
      if (isWheelRef.current && isDraggingRef.current) {
        isDraggingRef.current = false;
      }
      mouseRef.current = null;
    };

    // 鼠标事件监听
    const onClick = (event) => {
      if (!isTopDownRef.current) return;
      if (isDragRef.current || isWheelRef.current) return;
      calculateRaycaster(event);
      // 是否点击到多边形元素
      // 判断点击的是图层基准面还是图层多边形
      // 当前图层所有元素mesh
      const meshArray = currentLayerRef.current?.objects.map((obj) => obj.mesh);
      console.log("meshArray = ", meshArray);
      if (meshArray.length < 1) return;
      const intersects = raycasterRef.current.intersectObjects(meshArray);
      if (intersects.length < 1) return;
      const lastIntersect = intersects[intersects.length - 1];
      // 判断是否为基准面
      if (lastIntersect.object.userData.isBasePlane) {
        const point = lastIntersect.point; // 获取交点
        // 添加点
        console.log("point = ", point);
        const edgePoint = generatePoint(point);
        sceneRef.current.add(edgePoint);
        pointsRef.current.push(point);
        selectRef.current = null;
      } else {
        selectRef.current = lastIntersect.object;
        console.log("select object = ", selectRef.current);
      }
    };

    // 鼠标右键点击事件监听，用于清空points并取消绘制
    const onRightClick = (event) => {
      if (event.button === 2) {
        drawPolygon(pointsRef.current);
        pointsRef.current = [];
        console.log("sceneref = ", sceneRef.current.children);
      }
    };

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // 阻止默认右键菜单弹出
      onRightClick(e);
    });

    window.addEventListener("click", onClick);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("wheel", onZoomWheel); // 添加滚轮缩放事件监听
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("contextmenu", (e) => onRightClick(e));
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("wheel", onZoomWheel); // 添加滚轮缩放事件监听
      document.body.removeChild(renderRef.current.domElement);
    };
  }, []);

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

  const generateShape = (vertices) => {
    if (vertices.length <= 2) return;
    const shape = new THREE.Shape();
    // 起始点
    shape.moveTo(vertices[0].x, vertices[0].y);
    // 连接其他点
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].y);
    }

    // 闭合路径
    shape.closePath();
    // 创建一个Geometry并填充颜色
    const geometry = new THREE.ShapeGeometry(shape); // 创建面
    const material = new THREE.MeshBasicMaterial({
      color: currentLayerRef.current.color,
      side: THREE.DoubleSide, // 双面显示
      transparent: true,
      opacity: 0.5, // 设置透明度
      depthTest: false,
    });

    const shapeMesh = new THREE.Mesh(geometry, material);
    shapeMesh.userData.type = "face";
    drawEdge(geometry);
    return shapeMesh;
  };

  const drawEdge = (shapeGeomtry) => {
    // 创建边界
    const edgeGeometry = new THREE.EdgesGeometry(shapeGeomtry);
    const edgeMesh = new THREE.Line(
      edgeGeometry,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    edgeMesh.userData.type = "edge";
    sceneRef.current.add(edgeMesh);
  };

  const generatePoint = (vertex, isPointer) => {
    const radius = isPointer ? 20 : 16;
    const pointGeometry = new THREE.SphereGeometry(5, radius, radius); // 小球表示点
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: isPointer ? 0xffffff : 0xffff00,
    }); // 黄色材质
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.userData.type = "point"; // 标记为点
    pointMesh.userData.isPointer = isPointer;
    pointMesh.position.set(vertex.x, vertex.y, vertex.z);
    return pointMesh;
  };

  const generateLine = (vertices) => {
    if (vertices.length < 2) return;

    const lineMaterial = new THREE.LineBasicMaterial({
      color: currentLayerRef.current.color,
      linewidth: 10,
    });
    const planeVerticles = vertices.map(
      (vertice) => new THREE.Vector2(vertice.x, vertice.y)
    );
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      planeVerticles
    );
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.userData.type = "line";
    return line;
  };

  // 绘制多边形
  const drawPolygon = (vertices) => {
    // 清除之前的辅助点和边界
    sceneRef.current.children = sceneRef.current.children.filter(
      (obj) => obj.userData.type !== "point" && obj.userData.type !== "edge"
    );
    // 绘制点
    vertices.forEach((vertex) => {
      const pointMesh = generatePoint(vertex);
      sceneRef.current.add(pointMesh);
    });
    // 两个点则绘制线
    if (vertices.length === 2) {
      const line = generateLine(vertices);
      const lineShape = new Shape(line);
      currentLayerRef.current.addObject(lineShape);
    }
    // 创建面的几何体
    if (vertices.length < 3) return;
    //   drawFaceByEarCut(vertices);
    const face = generateShape(vertices);
    const faceShape = new Shape(face);
    console.log("face = ", face);
    currentLayerRef.current.addObject(faceShape);
  };
}
