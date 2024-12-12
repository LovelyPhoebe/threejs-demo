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
import { Button } from "antd";

function App() {
  const [topDown, setTopDown] = useState(true);
  // useBase();
  // useZhenlie()
  // useBufferGeom()
  // useInte()
  // useLine()
  useDrawPolygon({ topDown });
  return (
    <div className="App" id="app">
      <div className="btn">
        <Button onClick={() => setTopDown((pre) => !pre)} type="primary">
          {topDown ? "3D空间" : "俯视图"}
        </Button>
      </div>
    </div>
  );
}

export default App;
