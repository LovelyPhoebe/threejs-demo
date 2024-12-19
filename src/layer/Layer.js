class Observer {
  constructor() {
    this.listeners = [];
  }

  // 添加订阅者
  subscribe(listener) {
    this.listeners.push(listener);
  }

  // 通知所有订阅者
  notify() {
    this.listeners.forEach((listener) => listener());
  }
}

// 图层类，每个图层包含多个形状
export class Layer {
  constructor(name, scene) {
    this.name = name;
    this.objects = []; // 图层内所有的图形对象
    this.visible = true; // 是否可见
    this.selected = false; // 是否选中
    this.scene = scene;
    this.observer = new Observer();

    // 自动将新对象添加到场景
    this.subscribeToObjectChanges();
  }

  // 添加图形对象
  addObject(object) {
    this.objects.push(object);
    this.observer.notify(); // 通知对象变化
  }

  // 获取图层基准面
  getBasePlane() {
    const baseObj = this.objects.find((obj) => obj.isBasePlane);
    return baseObj?.mesh ?? null;
  }

  // 删除图形对象
  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
      this.observer.notify(); // 通知对象变化
    }
  }

  // 订阅对象变化，自动更新场景
  subscribeToObjectChanges() {
    this.observer.subscribe(() => {
      this.updateScene();
    });
  }

  // 更新场景中的图形对象
  updateScene() {
    // 先清空场景中的当前图层的对象
    this.scene.children = this.scene.children.filter(
      (obj) => obj.userData.layerType !== this.name
    );

    // 重新添加图层内的所有对象
    this.objects.forEach((obj) => {
      obj.mesh.userData.isLayerObject = true; // 给 mesh 添加一个标识
      obj.mesh.userData.layerType = this.name;
      obj.mesh.userData.isBasePlane = obj.isBasePlane;
      this.scene.add(obj.mesh);
    });
  }

  // 控制图层的显示与隐藏
  isVisibility(visible) {
    this.visible = visible;
    this.objects.forEach((obj) => (obj.mesh.visible = this.visible));
  }

  // 设置图层为选中状态
  select() {
    this.selected = true;
  }

  // 取消选中状态
  deselect() {
    this.selected = false;
  }
}
