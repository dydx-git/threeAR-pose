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
  let mesh, meshPosition;
  let camera;
  let poseNetModel, poses;
  let VIDEO_WIDTH;
  let VIDEO_HEIGHT;

  const loadModels = () => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/assets/models/mask.gltf",
      function (gltf) {
        scene.add(gltf.scene);
        mesh = gltf.scene;
        mesh.position.y = -2;
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
    renderer.setSize(window.innerWidth, window.innerHeight);
    webglContainer.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.bottom = "0px";
    document.body.appendChild(stats.domElement);

    raycaster = new THREE.Raycaster();
    meshPosition = new THREE.Vector2();

    scene = new THREE.Scene();

    // put a camera in the scene
    camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    camera.position.set(0, 0, 5);
    scene.add(camera);
  };

  function modelLoaded() {
    console.log("Model Loaded!");
  }

  // animation loop
  function animate() {
    if (mesh) {
      mesh.scale.set(2, 2, 2);
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
    console.log(getFacePose(poses[0].pose));
    // drawPoint(ctx, , 2 * nose.position.x - leftEye.position.x - rightEye.position.x, )
    // meshPosition.x = (nosePose.x / window.innerWidth) * 2 - 1;
    // //console.log(meshPosition.x);
    // meshPosition.y = -((nosePose.y + 1000) / window.innerHeight) * 2 + 1;
    // raycaster.setFromCamera(meshPosition, camera);
    // const dist = mesh.position.clone().sub(camera.position).length();
    // raycaster.ray.at(dist, mesh.position);
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
