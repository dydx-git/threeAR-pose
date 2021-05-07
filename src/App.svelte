<script>
  import { onMount } from "svelte";
  import * as THREE from "three/build/three.module";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import Stats from "stats.js/build/stats.min.js";
  import { poseNet } from "ml5";
  import { drawPoint, drawKeypoints } from "./utils/2DDraw";
  import { getPart, getFacePose, getBodyPose } from "./utils/posenet";
  let ctx, video, stream;
  let stats, scene, renderer, raycaster;
  let mesh, meshPosition, pivot, eyesPosition;
  let camera;
  let poseNetModel, poses;
  let VIDEO_WIDTH;
  let VIDEO_HEIGHT;
  //let model = "glasses"; // Change it to mask to use mask.
  let scale = 2;
  let pitchFactor = 75;
  const PATH = '/assets/models/';
  const models = ['mask.gltf','glasses/scene.gltf','glasses1/scene.gltf'];
 // import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
  const loadModels = () => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      PATH + models[1],
      // "https://s3-us-west-2.amazonaws.com/s.cdpn.io/39255/ladybug.gltf",
      //"/assets/models/glasses (1)/scene.gltf",
      function (gltf) {
        //scene.add(gltf.scene);
        mesh = gltf.scene;
        //const texture = new THREE.TextureLoader().load( "/assets/models/glasses/textures/Handles_baseColor.jpeg");
        const box = new THREE.Box3().setFromObject(mesh);
        box.getCenter(mesh.position);
        mesh.position.multiplyScalar(-1);
        pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(mesh);
        /*      IMPORTANT
        use the pivot to scale, rotate and position
        the 3D object. DO NOT USE mesh.
        */

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
    eyesPosition = new THREE.Vector2(); // For glasses purposes
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

    var light = new THREE.PointLight( 0xffffcc, 10, 200 );
    light.position.set( 4, 30, -20 );
    scene.add( light );

    var light2 = new THREE.AmbientLight( 0x20202A, 20, 100 );
    light2.position.set( 30, -10, 30 );
    scene.add( light2 );
  };

  function modelLoaded() {
    console.log("Model Loaded!");
  }
  //let controls = new THREE.OrbitControls(camera, renderer.domElement);
  // animation loop
  function animate() {
    if (mesh && pivot && poses) {
      // const { yaw, pitch } = getFacePose(poses[0].pose);
      const { yaw, pitch } = getBodyPose(poses[0].pose);
      // console.log("Pitch ", pitch);
      console.log("Yaw ", yaw);
      let normalizedYaw = (yaw - 90) * (Math.PI / 180);
      let normalizedPitch = (pitch - pitchFactor) * (Math.PI / 180);
      if (normalizedYaw) {
        pivot.rotation.y = normalizedYaw; // Left Right
        pivot.rotation.x = -normalizedPitch; // Up down
      }
      // pivot.rotation.y += 0.01;
      // pivot.rotation.set(0, angle, 0);
      //mesh.rotation.y += 0.01;
      pivot.scale.set(scale, scale, scale);
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
    const nose = getPart("nose", poses[0].pose)[0];
    //console.log(leftEye);
    //drawPoint(ctx, , 2 * nose.position.x - leftEye.position.x - rightEye.position.x, )
    meshPosition.x = -((nose.position.x / VIDEO_WIDTH) * 2 - 1);
    //console.log(meshPosition.x);
    meshPosition.y = -(nose.position.y / VIDEO_HEIGHT) * 2 + 1;
    raycaster.setFromCamera(meshPosition, camera);
    const dist = pivot.position.clone().sub(camera.position).length();
    // console.log(dist);
    raycaster.ray.at(dist, pivot.position);
    // // mesh.position.set(nosePose.x, nosePose.y, 40);


    // For Glasses model 
    const leftEye = getPart("leftEye", poses[0].pose)[0];
    const rightEye = getPart("rightEye", poses[0].pose)[0];
    eyesPosition.x = ((-((leftEye.position.x / VIDEO_WIDTH) * 2 - 1))+(-((rightEye.position.x / VIDEO_WIDTH) * 2 - 1)))/2;
    //console.log(meshPosition.x);
    eyesPosition.y = ((-((leftEye.position.y / VIDEO_HEIGHT) * 2 - 1))+(-((rightEye.position.y / VIDEO_HEIGHT) * 2 - 1)))/2;
    raycaster.setFromCamera(eyesPosition, camera);
    const distEye = pivot.position.clone().sub(camera.position).length();
    // console.log(distEye);
    raycaster.ray.at(distEye, pivot.position);
  }

  const handleKeydown = e => {
    switch (e.keyCode) {
      case 38:
        scale += 0.01;
        // pitchFactor += 1;
        break;

      case 40:
        scale -= 0.01;
        // pitchFactor -= 1;
        break;
      
      case 67:
        // console.log(pitchFactor);
        console.log(scale);
    
      default:
        break;
    }
    if(e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40)
      console.log("Arrow key pressed: " + e.keyCode);
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

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
