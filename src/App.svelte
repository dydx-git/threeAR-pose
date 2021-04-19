<script>
  import { onMount } from "svelte";
  import * as THREE from "three/build/three.module";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import Stats from "stats.js/build/stats.min.js";
  import { poseNet } from "ml5";
  import { drawPoint, drawKeypoints } from "./utils/2DDraw";
  import { getPart, getFacePose } from "./utils/posenet";
  let ctx, video, stream;
  let stats, scene, renderer, raycaster;
  let mesh, meshPosition, pivot;
  let camera;
  let poseNetModel, poses;
  let VIDEO_WIDTH;
  let VIDEO_HEIGHT;
  let model = "glasses"; // Change it to mask to use mask.
 // import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
  const loadModels = () => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      //"/assets/models/mask.gltf",
      "/assets/models/glasses/scene.gltf",
      function (gltf) {
        //scene.add(gltf.scene);
        mesh = gltf.scene;

        const box = new THREE.Box3().setFromObject(mesh);
        box.center(mesh.position);
        mesh.position.multiplyScalar(-1);

        pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(mesh);
        /*      IMPORTANT
        use the pivot to scale, rotate and position
        the 3D object. DO NOT USE mesh.
        */
        //console.log(pivot.position);

       

        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
  };

  const init = () => {
    renderer = new THREE.WebGLRenderer({
      antialias: false, // to get smoother output
      preserveDrawingBuffer: true, // to allow screenshot
      alpha: true,
    });
    renderer.setSize(VIDEO_WIDTH, VIDEO_HEIGHT);
    webglContainer.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.bottom = "0px";
    document.body.appendChild(stats.domElement);

    raycaster = new THREE.Raycaster();
    meshPosition = new THREE.Vector2();

    scene = new THREE.Scene();

    // const size = 1;
    // const near = 5;
    // const far = 50;

    // put a camera in the scene
    camera = new THREE.OrthographicCamera(
      -VIDEO_WIDTH / 200,
      VIDEO_WIDTH / 200,
      VIDEO_HEIGHT / 200,
      -VIDEO_HEIGHT / 200,
      0.1,
      1000
    );
    camera.zoom = 0.2;
    camera.position.set(0, 0, 5);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);
  };

  function modelLoaded() {
    console.log("Model Loaded!");
  }
  //let controls = new THREE.OrbitControls(camera, renderer.domElement);
  // animation loop
  function animate() {
    if (mesh && pivot && poses) {
      const { yaw, pitch } = getFacePose(poses[0].pose);
      // console.log("Pitch ", pitch);
      let normalizedAngle = (yaw - 95) * (Math.PI / 180);
      let normalizedPitch = (pitch - 100) * (Math.PI / 180);
      if (normalizedAngle) {
        pivot.rotation.y = normalizedAngle;
        pivot.rotation.x = -normalizedPitch;
      }
      if (model == "glasses") {
        pivot.position.set(meshPosition.x+1,meshPosition.y+0.5,0);
        console.log(pivot.position); 



      }
      // pivot.rotation.y += 0.01;
      // pivot.rotation.set(0, angle, 0);
      //mesh.rotation.y += 0.01;
      pivot.scale.set(2, 2, 2);
    }
    // loop on request animation loop
    // - it has to be at the begining of the function
    // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    requestAnimationFrame(animate);

    // do the render
    render();

    // update stats
    stats.update();
  }

  // render the scene
  function render() {
    // update camera controls
    // cameraControls.update();

    // actually render the scene
    renderer.render(scene, camera);
  }

  async function getMedia(constraints) {
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);

      /* use the stream */
    } catch (err) {
      console.log("error in getting input stream: " + err.message);
    }
    return stream;
  }

  onMount(async () => {
    const canvas = document.createElement("CANVAS");
    ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(100, 100, 150, 100);
    ctx.stroke();
    threeContainer.appendChild(canvas);

    stream = await getMedia({
      video: {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      }, // navigator.mediaDevices.getSupportedConstraints()
    });
    let { width, height } = stream.getTracks()[0].getSettings();

    VIDEO_WIDTH = width;
    VIDEO_HEIGHT = height;

    document.querySelector("video").srcObject = stream;

    if (!init()) {
      poseNetModel = poseNet(video, "single", modelLoaded);
      poseNetModel.on("pose", function (results) {
        poses = results;
        video.width = VIDEO_WIDTH;
        video.height = VIDEO_HEIGHT;
        canvas.width = VIDEO_WIDTH;
        canvas.height = VIDEO_HEIGHT;
        ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.translate(VIDEO_WIDTH, 0);
        ctx.scale(-1, 1);
        ctx.save();
        ctx.restore();
      });

      loadModels();
      animate();
    }
  });

  $: if (poses && mesh) {
    drawKeypoints(ctx, poses);
x
    const nose = getPart("nose", poses[0].pose)[0];

    //drawPoint(ctx, , 2 * nose.position.x - leftEye.position.x - rightEye.position.x, )
    meshPosition.x = -((nose.position.x / VIDEO_WIDTH) * 2 - 1);
    console.log(meshPosition.x);
    meshPosition.y = -(nose.position.y / VIDEO_HEIGHT) * 2 + 1;
    console.log(meshPosition.y);
    raycaster.setFromCamera(meshPosition, camera);
    const dist = pivot.position.clone().sub(camera.position).length();
    // console.log(dist);
    raycaster.ray.at(dist, pivot.position);
    // // mesh.position.set(nosePose.x, nosePose.y, 40);
  }
</script>

<main>
  <div id="container">
    <div id="webglContainer" />
    <div id="threeContainer" />
    <div id="videoContainer">
      <video
        id="video"
        bind:this={video}
        autoplay
        muted="true"
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </div>
  </div>
</main>

<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  /* make the canvases, children of the this container */
  #container {
    position: relative;
  }

  #webglContainer {
    position: absolute;
    pointer-events: none;
    /* this element will not catch any events */
    z-index: 8;
    /* position this canvas at bottom of the other one */
  }

  #videoContainer {
    position: absolute;
    pointer-events: none;
    /* this element will not catch any events */
    z-index: 6;
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
    /* position this canvas at bottom of the other one */
  }

  #threeContainer {
    position: absolute;
    z-index: 10;
    /* position this canvas on top of the other one */
  }
</style>
