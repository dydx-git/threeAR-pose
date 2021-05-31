
import * as THREE from "three/build/three.module";

export function getTHREEbasics(scene){    

  const light = new THREE.PointLight(0xffffcc, 10, 200);
  light.position.set(4, 30, -20);
  scene.add(light);

  const light2 = new THREE.AmbientLight(0x20202a, 20, 100);
  light2.position.set(30, -10, 30);
  scene.add(light2);
    
    return scene;
}
