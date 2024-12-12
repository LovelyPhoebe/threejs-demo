import logo from "./logo.svg";
import "./App.css";
import "antd/dist/antd.css";
// 引入three.js
import * as THREE from "three";
import { useEffect, useState } from "react";
// 引入轨道控制器扩展库OrbitControls.js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useBase } from "./hook/useBase";
import { useZhenlie } from "./hook/useZhenlie";
import { useBufferGeom } from "./hook/useBufferGeom";
import { useLine } from "./hook/useLine";
import { useInte } from "./hook/useInte";
import { useDrawPolygon } from "./hook/useDrawPolygon";
import { Button, Space } from "antd";

function App() {
  const [topDown, setTopDown] = useState(true);
  const [rotate, setRotate] = useState(0);
  // useBase();
  // useZhenlie()
  // useBufferGeom()
  // useInte()
  // useLine()
  useDrawPolygon({ topDown, rotate });
  return (
    <div className="App" id="app">
      <div className="btn">
        <Space>
          <Button onClick={() => setTopDown((pre) => !pre)} type="primary">
            {topDown ? "3D空间" : "俯视图"}
          </Button>
          <Button onClick={() => setRotate((pre) => pre + 30)}>
            旋转 {rotate} 度
          </Button>
        </Space>
      </div>
    </div>
  );
}

export default App;
