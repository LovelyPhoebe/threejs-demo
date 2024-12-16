import { Slider } from "antd";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import "./RotateMap.css";
import sliderPng from "../assets/slider_s.png"

function RotateMap({ onSliderChange }, ref) {
  const [sliderText, setSliderText] = useState(0);

  useImperativeHandle(ref, () => {
    return {
      resetRotation: () => {
        setSliderText(0);
        if (onSliderChange) {
          onSliderChange(0);
        }
      }
    }
  })

  const onChangeSlider = (value) => {
    if (isNaN(value)) {
      return;
    }
    const rotation = (+value * Math.PI) / 180;
    setSliderText(value);
    if (onSliderChange) {
      onSliderChange(rotation);
    }
  };

  return (
    <div className={"sliderBox"}>
      <div className={"sliderText"}>{sliderText}&deg;</div>
      <Slider
        className={"sliderEle"}
        vertical
        tipFormatter={null}
        defaultValue={0}
        min={0}
        max={360}
        value={typeof sliderText === "number" ? sliderText : 0}
        onChange={onChangeSlider}
      />
      <div className={"sliderImg"}>
        <img
          src={sliderPng}
          alt=""
          width="20px"
          height="20px"
        ></img>
      </div>
    </div>
  );
}

export default forwardRef(RotateMap);
