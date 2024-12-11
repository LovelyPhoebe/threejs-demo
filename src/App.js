import logo from "./logo.svg";
import "./App.css";
// 引入three.js
import * as THREE from "three";
import { useEffect } from "react";
// 引入轨道控制器扩展库OrbitControls.js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useBase } from "./hook/useBase";
import { useZhenlie } from "./hook/useZhenlie";
import { useBufferGeom } from "./hook/useBufferGeom";
import { useLine } from "./hook/useLine";
import { useInte } from "./hook/useInte";

function App() {
  // useBase();
  // useZhenlie()
  // useBufferGeom()
  useInte()
  // useLine()
  return <div className="App" id="app"></div>;
}

export default App;
