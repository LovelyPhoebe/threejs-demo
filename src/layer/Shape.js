import * as THREE from "three";
// 形状类，每个形状是一个 3D 对象

export class Shape {
  constructor(mesh, isBasePlane = false) {
    this.mesh = mesh;
    this.selected = false; // 是否被选中
    this.isBasePlane = isBasePlane; // 是否为图层的基准面
    this.color = this.mesh.material.color.getHex()
  }

  // 选中该形状
  select() {
    this.selected = true;
    if (this.mesh.material) {
      // 检查材质是否存在且可以访问到颜色属性
      if (Array.isArray(this.mesh.material)) {
        // 如果是多个材质（例如使用了材质数组），遍历修改每个材质的颜色
        this.mesh.material.forEach((material) => {
          if (material instanceof THREE.MeshBasicMaterial) {
            material.color.set(0xff0000); // 改变为红色
          }
        });
      } else {
        // 单一材质的情况
        const material = this.mesh.material;
        if (material instanceof THREE.MeshBasicMaterial) {
          material.color.set(0xff0000); // 改变为红色
        }
      }
    }
  }

  // 取消选中
  deselect() {
    this.selected = false;
    // 检查材质是否存在且可以访问到颜色属性
    if (Array.isArray(this.mesh.material)) {
      // 如果是多个材质（例如使用了材质数组），遍历修改每个材质的颜色
      this.mesh.material.forEach((material) => {
        if (material instanceof THREE.MeshBasicMaterial) {
          material.color.set(this.color); // 改变为绿色
        }
      });
    } else {
      // 单一材质的情况
      const material = this.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.color.set(this.color); // 改变为绿色
      }
    }
  }
}
