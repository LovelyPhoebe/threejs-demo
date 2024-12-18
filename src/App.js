import logo from "./logo.svg";
import "./App.css";
import "antd/dist/antd.css";
// 引入three.js
import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
// 引入轨道控制器扩展库OrbitControls.js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useBase } from "./hook/useBase";
import { useZhenlie } from "./hook/useZhenlie";
import { useBufferGeom } from "./hook/useBufferGeom";
import { useLine } from "./hook/useLine";
import { useInte } from "./hook/useInte";
import { useDrawPolygon } from "./hook/useDrawPolygon";
import { Button, Space } from "antd";
import RotateMap from "./comp/RotateMap";
import { radToDeg } from "./utils/tool";

function App() {
  const [topDown, setTopDown] = useState(true);
  const [rad, serRad] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const [isWheel, setIsWheel] = useState(false);
  // useBase();
  // useZhenlie()
  // useBufferGeom()
  // useInte()
  // useLine()
  useDrawPolygon({ topDown, rad, isDrag, isWheel });

  const deg = useMemo(() => {
    return radToDeg(rad).toFixed(1);
  }, [rad]);
  return (
    <div className="App" id="app">
      <div className="btn">
        <Space>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setTopDown((pre) => !pre);
            }}
            type="primary"
          >
            {topDown ? "3D空间" : "俯视图"}
          </Button>
          <Button>旋转 {deg} 度</Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDrag((pre) => !pre);
            }}
          >
            {isDrag ? "取消拖拽" : "拖拽"}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsWheel((pre) => !pre);
            }}
          >
            {isWheel ? "取消缩放" : "缩放"}
          </Button>
        </Space>
      </div>
      <RotateMap
        onSliderChange={(rad) => {
          serRad(rad);
        }}
      />
    </div>
  );
}

export default App;
