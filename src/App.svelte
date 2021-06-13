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
  let mesh, meshPosition, pivot, eyesPosition;
  let camera;
  let poseNetModel, poses;
  let VIDEO_WIDTH;
  let VIDEO_HEIGHT;
  let xOffset = 0.0;
  let yOffset = 0.0;
  let scale = 2.9;
  let pitchFactor = 75;
  let farPlaneFactor = 5;
  let captureOpacity = 0;
  const PATH = "/assets/models/";
  const models = ["mask.gltf", "glasses/scene.gltf", "glasses1/scene.gltf"];
  let bitches = 0;
  const loadModels = () => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      PATH + models[0],
      //"/assets/models/glasses (1)/scene.gltf",
      function (gltf) {
        mesh = gltf.scene;
        const box = new THREE.Box3().setFromObject(mesh);
        box.getCenter(mesh.position);
        mesh.position.multiplyScalar(-1);
        pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(mesh);
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
    renderer.setSize(window.innerWidth, VIDEO_HEIGHT);
    webglContainer.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.bottom = "0px";
    document.body.appendChild(stats.domElement);

    raycaster = new THREE.Raycaster();
    meshPosition = new THREE.Vector2();
    eyesPosition = new THREE.Vector2(); // For glasses purposes
    scene = new THREE.Scene();
    // const near = 5;
    var light2 = new THREE.AmbientLight(0x20202a, 20, 100);
    light2.position.set(30, -10, 30);
    scene.add(light2);

    camera = new THREE.OrthographicCamera(
      -VIDEO_WIDTH / 200,
      VIDEO_WIDTH / 200,
      VIDEO_HEIGHT / 200,
      -VIDEO_HEIGHT / 200,
      0.1,
      farPlaneFactor
    );
    camera.zoom = 0.2;
    camera.position.set(0, 0, 5);
    scene.add(camera);

    // var light = new THREE.PointLight(0xffffcc, 10, 200);
    // light.position.set(4, 30, -20);
    // scene.add(light);

    // var light2 = new THREE.AmbientLight(0x20202a, 20, 100);
    // light2.position.set(30, -10, 30);
    // scene.add(light2);
  };

  function modelLoaded() {
    console.log("Model Loaded!");
  }
  // animation loop
  function animate() {
    if (mesh && pivot && poses) {
      const { yaw, pitch } = getFacePose(poses[0].pose);
      // let normalizedYaw = (yaw - 90) * (Math.PI / 180);
      // let normalizedPitch = (pitch - pitchFactor) * (Math.PI / 180);
      // if (normalizedYaw) {
      //   pivot.rotation.y = normalizedYaw; // Left Right
      //   pivot.rotation.x = -normalizedPitch; // Up down
      // }
      // pivot.rotation.set(0, angle, 0);
      pivot.scale.set(scale, scale, scale);
      drawKeypoints(ctx, poses);

      const nose = getPart("nose", poses[0].pose)[0];
      meshPosition.x = nose.position.x + xOffset;
      meshPosition.y = nose.position.y + yOffset;

      const leftEye = getPart("leftEye", poses[0].pose)[0];
      const rightEye = getPart("rightEye", poses[0].pose)[0];
      eyesPosition.x = (leftEye.position.x + rightEye.position.x) / 2;
      eyesPosition.y = (leftEye.position.y + rightEye.position.y) / 2;
      eyesPosition.x += bitches;
      console.log(eyesPosition.x);
      const pos3D = getWorldCoords(
        eyesPosition.x + ((xOffset/100)*eyesPosition.x),
        eyesPosition.y + yOffset,
        VIDEO_HEIGHT,
        VIDEO_WIDTH
      );
      pivot.position.set(pos3D.x, pos3D.y, 1);

      // - it has to be at the begining of the function
      stats.update();
    }
    requestAnimationFrame(animate);
    render();
  }
  function render() {
    // cameraControls.update();

    renderer.render(scene, camera);
  }

  async function getMedia(constraints) {
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
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
        canvas.width = window.innerWidth;
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

  function getWorldCoords(x, y, height, width) {
    // (-1,1), (1,1), (-1,-1), (1, -1)
    var normalizedPointOnScreen = new THREE.Vector3();
    normalizedPointOnScreen.x = -((x / width) * 2 - 1);
    normalizedPointOnScreen.y = -(y / height) * 2 + 1;
    normalizedPointOnScreen.z = 0.0; // set to z position of mesh objects
    normalizedPointOnScreen.unproject(camera);
    normalizedPointOnScreen.sub(camera.position).normalize();
    var distance = -camera.position.z / normalizedPointOnScreen.z,
      scaled = normalizedPointOnScreen.multiplyScalar(distance),
      coords = camera.position.clone().add(scaled);

    return new THREE.Vector3(coords.x, coords.y, coords.z);
  }

  const handleKeydown = (e) => {
    const arrowKeysEnum = { up: 38, down: 40, left: 37, right: 39 };
    const alphabetsEnum = { p: 80, s: 83, c: 67 };
    Object.freeze(arrowKeysEnum);
    Object.freeze(alphabetsEnum);

    const deltaFactor = 10;

    if (e.ctrlKey && e.keyCode == arrowKeysEnum.up) {
      yOffset -= deltaFactor;
    } else if (e.ctrlKey && e.keyCode == arrowKeysEnum.down) {
      yOffset += deltaFactor;
    } else if (e.ctrlKey && e.keyCode == arrowKeysEnum.left) {
      xOffset += deltaFactor;
    } else if (e.ctrlKey && e.keyCode == arrowKeysEnum.right) {
      xOffset -= deltaFactor;
    }
    if (e.shiftKey && e.keyCode == arrowKeysEnum.up) {
      bitches += deltaFactor * 0.01;
    } else if (e.shiftKey && e.keyCode == arrowKeysEnum.down) {
      bitches -= deltaFactor * 0.01;
    }
    if (e.altKey && e.keyCode == arrowKeysEnum.up) {
      captureOpacity += deltaFactor * 0.01;
    } else if (e.altKey && e.keyCode == arrowKeysEnum.down) {
      captureOpacity -= deltaFactor * 0.01;
    }
    if (e.keyCode == alphabetsEnum.c) {
      console.log(`offsets: xOffset: ${xOffset}, yOffset: ${yOffset}`);
      // console.log(`scale: ${scale}`);
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<main style="--capture-opacity: {captureOpacity}">
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
  #container {
    position: relative;
  }
  html {
    background-color: black;
  }

  #webglContainer {
    position: absolute;
    pointer-events: none;
    z-index: 8;
  }

  #videoContainer {
    position: absolute;
    pointer-events: none;
    z-index: 6;
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
    opacity: var(--capture-opacity);
  }

  #threeContainer {
    position: absolute;
    z-index: 10;
  }
</style>
