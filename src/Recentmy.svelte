<script>
  import { onMount } from "svelte";
  import * as THREE from "three/build/three.module";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import Stats from "stats.js/build/stats.min.js";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

  let ctx, video, stream;
  let stats, scene, renderer;
  let mesh, pivot;
  let camera;
  let poseNetModel, poses;
  let VIDEO_WIDTH;
  let VIDEO_HEIGHT;
  let controls;
  let scaleX = 8.9;
  let scaleY = 10;
  let scaleZ = 1;
  let yMovement = 1;
  let xMovement = 1;

  const loadModels = () => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/assets/models/alien/alienSuit.gltf",
      function (gltf) {
        mesh = gltf.scene;
        // console.log(mesh);

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    webglContainer.appendChild(renderer.domElement);

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

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    scene.add(camera);

    var light = new THREE.PointLight(0xffffcc, 10, 200);
    light.position.set(4, 30, -20);
    scene.add(light);
    var light2 = new THREE.AmbientLight(0x20202a, 20, 100);
    light2.position.set(3, -1, 2);
    scene.add(light2);
  };

  function modelLoaded() {
    console.log("Model Loaded!");
  }

  // animation loop
  function animate() {
    if (mesh) {
      pivot.rotation.y += 0.01;
      pivot.position.set(0, -1, 0);;

      mesh.traverse(function (child) {
        if (child.isBone) {
          if (
            [
              "mixamorigLeftForeArm",
              "mixamorigLeftShoulder",
              "mixamorigLeftArm",
              "mixamorigLeftHand"
            ].includes(child.name)
          ) {
            // child.position.set(scaleX, scaleY, scaleZ);
          }
        if (child.isBone && child.name === 'mixamorigLeftArm'){
          child.rotation.y = yMovement;
          child.rotation.x = xMovement;
        }
        }
      });
    }
    // loop on request animation loop
    // - it has to be at the begining of the function
    // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    requestAnimationFrame(animate);

    // do the render
    render();

    // update stats
    stats.update();
    controls.update();
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

  function drawPoint(y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
  }

  onMount(async () => {
    const canvas = document.createElement("CANVAS");
    ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(100, 100, 150, 100);
    ctx.stroke();
    threeContainer.appendChild(canvas);

    // stream = await getMedia({
    //   video: {
    //     width: { ideal: 4096 },
    //     height: { ideal: 2160 },
    //   }, // navigator.mediaDevices.getSupportedConstraints()
    // });
    // let { width, height } = stream.getTracks()[0].getSettings();

    // VIDEO_WIDTH = width;
    // VIDEO_HEIGHT = height;

    // console.log(`${VIDEO_WIDTH} x ${VIDEO_HEIGHT}`);
    // document.querySelector("video").srcObject = stream;
    

    if (!init()) {
      // poseNetModel = poseNet(video, modelLoaded);
      // poseNetModel.on("pose", function (results) {
      //   poses = results;
      //   video.width = VIDEO_WIDTH;
      //   video.height = VIDEO_HEIGHT;
      canvas.width = VIDEO_WIDTH;
      canvas.height = VIDEO_HEIGHT;
      ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      ctx.save();
      ctx.restore();
      // });

      loadModels();
      animate();
    }
  });

  $: if (poses && mesh) {
    drawKeypoints(ctx, poses);
    const rightShoulder = getPart("rightShoulder", poses[0].pose)[0];
    const leftShoulder = getPart("leftShoulder", poses[0].pose)[0];
    x1 = -((leftShoulder.position.x / VIDEO_WIDTH) * 2 - 1);
    x2 = -((rightShoulder.position.x / VIDEO_WIDTH) * 2 - 1);
    meshPosition.x = (x1 + x2) / 2 ;
    y1 = -((leftShoulder.position.y / VIDEO_HEIGHT) * 2 );
    y2 =-((rightShoulder.position.y / VIDEO_HEIGHT) * 2 );
    meshPosition.y = (y1 + y2) / 2;
    //console.log(meshPosition);

    raycaster.setFromCamera(meshPosition, camera);
    const dist = pivot.position.clone().sub(camera.position).length();
    //console.log(dist);
    raycaster.ray.at(dist, pivot.position); // just try logging raycaster.ray first OR just raycaster and check the methods you can call
   // console.log(s);
    console.log(raycaster);
  }

  const handleKeydown = (e) => {
    switch (e.keyCode) {
      case 38:
        // scaleZ += 10;
        // yMovement +=0.5
        xMovement +=0.5
        break;
      case 40:
        // scaleZ -= 10;
        // yMovement -=0.5
        xMovement -=0.5
        break;
      case 37:
        // scaleZ -= 10;
        yMovement -=0.5
        // xMovement -=0.5
        break;
      case 39:
        // scaleZ -= 10;
        yMovement -=0.5
        // xMovement -=0.5
        break;
      // case 73:
      //   // scale -= 0.01;
      //   // pivot.position.z -= 0.01;
      //   // pitchFactor -= 1;
      //   init();
      //   loadModels();
      //   animate();
      //   console.log(`camera initalized with ${farPlaneFactor}`);
      //   break;
      case 67:
        // console.log(pitchFactor);
        // console.log(`farPlaneVector: ${farPlaneFactor}`);
        // console.log(`scale: ${scale}`);
        // console.log(`z position: ${pivot.position.z}`);
        // console.log(`mesh: ${mesh}`);
        console.log(`scaleX: ${scaleX}, scaleY: ${scaleY}, scaleZ ${scaleZ}`);
      default:
        break;
    }
    if (
      e.keyCode == 37 ||
      e.keyCode == 38 ||
      e.keyCode == 39 ||
      e.keyCode == 40
    )
      console.log("Arrow key pressed: " + e.keyCode);
  };
</script>

<svelte:window on:keydown={handleKeydown} />

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
    /* position this canvas at bottom of the other one */
  }

  #threeContainer {
    position: absolute;
    z-index: 10;
    /* position this canvas on top of the other one */
  }
</style>
