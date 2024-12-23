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
import { Button, Space, Radio } from "antd";
import RotateMap from "./comp/RotateMap";
import { radToDeg } from "./utils/tool";

const layers = [
  {
    label: "虚拟墙",
    value: "wall",
  },
  {
    label: "斜坡",
    value: "slope",
  },
];

function App() {
  const [topDown, setTopDown] = useState(true);
  const [rad, serRad] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const [isWheel, setIsWheel] = useState(false);
  const [curLayer, setCurLayer] = useState("wall");
  // useBase();
  // useZhenlie()
  // useBufferGeom()
  // useInte()
  // useLine()
  useDrawPolygon({ topDown, rad, isDrag, isWheel, curLayer });

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
      <div className="layers">
        <Radio.Group
          options={layers}
          onChange={(e) => {
            console.log("e = ", e);
            e.stopPropagation();
            e.preventDefault();
            setCurLayer(e.target.value);
          }}
          value={curLayer}
          optionType="button"
          buttonStyle="solid"
        />
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
