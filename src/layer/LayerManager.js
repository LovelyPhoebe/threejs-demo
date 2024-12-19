// 图层管理器，管理多个图层
export class LayerManager {
  constructor() {
    this.layers = []; // 存储所有图层
    this.selectedLayer = null; // 当前选中的图层
  }

  // 添加图层
  addLayer(layer) {
    this.layers.push(layer);
  }

  // 选择图层
  selectLayer(layerName) {
    if (this.selectedLayer) {
      // 取消当前选中图层内的所有形状的选中状态
      this.selectedLayer.deselect();
    }

    // 选中新的图层
    this.selectedLayer = this.layers.find((layer) => layer.name === layerName);
    this.selectedLayer.select(); // 选中图层内的所有形状
    return this.selectedLayer;
  }

  // 切换图层可见性
  isLayerVisibility(layerName, visible) {
    const layer = this.layers.find((layer) => layer.name === layerName);
    layer.isLayerVisibility(visible);
  }
}
