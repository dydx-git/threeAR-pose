import * as THREE from "three/build/three.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export {
    loadModels
};

function loadModels(resourceURL) {
    // let modelTexture = new THREE.TextureLoader().load('\\assets\\models\\textures\\leather_baseColor.jpg');
    // let modelAlphaMap = new THREE.TextureLoader().load('\\assets\\models\\textures\\metal_baseColor.jpg');
    // modelTexture.flipY = false;
    // const modelMaterial = new THREE.MeshBasicMaterial();
    // modelMaterial.map = modelTexture;
    const gltfLoader = new GLTFLoader();

    return new Promise((resolve,reject) => {
      const onLoad = resource => resolve(resource);
      const onProgress = () => {};
      const onError = (e) => {
        console.log('Failed to load resources: '+ e);
        reject(e);
      };
      gltfLoader.load(resourceURL,onLoad,onProgress,onError);
    });

    // gltfLoader.load(
    //   "/assets/models/alien/alienSuit.gltf",
    //   // "/assets/models/Metarig-Shirt.gltf",
    //   function (gltf) {
    //     alien = gltf;
    //     console.log(alien.parser.associations);
    //     //scene.add(gltf.scene);
    //     console.log(gltf.scene);
    //     console.log(alien);
    //     mesh = gltf.scene;

    //     const box = new THREE.Box3().setFromObject(mesh);
    //     box.center(mesh.position);
    //     mesh.position.multiplyScalar(-1);

    //     pivot = new THREE.Group();
    //     scene.add(pivot);
    //     // mesh.traverse(e => {
    //     //   if (e.isMesh) {
    //     //     e.material = modelMaterial;
    //     //   }
    //     // });
    //     pivot.add(mesh);
    //     /*      IMPORTANT
    //     use the pivot to scale, rotate and position
    //     the 3D object. DO NOT USE mesh.
    //     */
    //     //console.log(pivot.position);

       

    //     const axesHelper = new THREE.AxesHelper(100);
    //     scene.add(axesHelper);

    //     return alien
    //   },
    //   undefined,
    //   function (error) {
    //     console.error(error);
    //   }
    // );
    // let alienMan = new GLTFLoader().parse('assets/models/alien/alienSuit.gltf')
    
};