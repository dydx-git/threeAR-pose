<script>
  import { onMount } from "svelte";
  import * as THREE from "three/build/three.module";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import Stats from "stats.js/build/stats.min.js";
  import { poseNet } from "ml5";

  let canvas, ctx, video, stream;
  let stats, scene, renderer;
  let mesh;
  let camera;
  let poseNetModel, poses;
  const VIDEO_WIDTH = 1280;
  const VIDEO_HEIGHT = 720;
  const minConfidence = 0.3;

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
      antialias: true, // to get smoother output
      preserveDrawingBuffer: true, // to allow screenshot
    });
    renderer.setClearColor(0xbbbbbb, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.bottom = "0px";
    document.body.appendChild(stats.domElement);

    scene = new THREE.Scene();

    // put a camera in the scene
    camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      1,
      10000
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
      mesh.rotation.y += 0.01;
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

  // A function to draw ellipses over the detected keypoints
  function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
      // For each pose detected, loop through all the keypoints
      let pose = poses[i].pose;
      for (let j = 0; j < pose.keypoints.length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
          const { y, x } = keypoint.position;
          drawPoint(y - 2, x, 3);
        }
      }
    }
  }

  function drawSegment(pair1, pair2, color, scale) {
    ctx.beginPath();
    ctx.moveTo(pair1.x * scale, pair1.y * scale);
    ctx.lineTo(pair2.x * scale, pair2.y * scale);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function drawSkeleton(keypoints) {
    const color = "#FFFFFF";
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
      keypoints,
      minConfidence
    );

    adjacentKeyPoints.forEach((keypoint) => {
      drawSegment(keypoint[0].position, keypoint[1].position, color, 1);
    });
  }

  function drawPoint(y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }

  onMount(async () => {
    ctx = canvas.getContext("2d");
    stream = await getMedia({
      video: true, // navigator.mediaDevices.getSupportedConstraints()
    });
    document.querySelector("video").srcObject = stream;
    if (!init()) {
      poseNetModel = poseNet(video, modelLoaded);
      poseNetModel.on("pose", function (results) {
        poses = results;
        canvas.width = VIDEO_WIDTH;
        canvas.height = VIDEO_HEIGHT;
        ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.save();
        ctx.restore();
      });
      loadModels();
      animate();
    }
  });

  $: if (poses) {
    drawKeypoints();
    // drawSkeleton();
  }
</script>

<main>
  <div id="container">
    <canvas
      id="canvas"
      bind:this={canvas}
      style="position:absolute;top:0;left:0;z-index:1;"
    />
    <video
      id="video"
      bind:this={video}
      autoplay
      muted="true"
      position="relative"
      width="1280"
      height="720"
    />
  </div>
</main>

<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
