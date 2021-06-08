<script>
  import { getImports } from "./utils/imports";
  const {
    onMount,
    THREE,
    GLTFLoader,
    Stats,
    drawKeypoints,
    getPart,
    getFacePose,
    get2DCanvasContext,
    getStream,
    getPreferredVideoDimensions,
    initPosenet,
    drawHome,
    getTHREEbasics,
    Mask,
    Glasses,
    FaceRotation,
    get_spread_update,
    TraverseBones,
  } = getImports();

  let scale = 2;
  let xOffset = 0.0;
  let yOffset = 0.0;

  const PATH = "/assets/models/";
  const MODELS = {
    MASK: "mask.gltf",
    SPECTACLES: "glasses/scene.gltf",
    COSTUME: "alien/alienSuit.gltf",
  };
  const canvas = document.createElement("CANVAS");
  let ctx = get2DCanvasContext(canvas);

  const stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.bottom = "0px";
  document.body.appendChild(stats.domElement);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, // to get smoother output
    preserveDrawingBuffer: true, // to allow screenshot
    alpha: true,
  });

  const scene = new THREE.Scene();

  getTHREEbasics(scene);

  let isVideoLoaded = false;
  let video;
  let camera;
  let mesh, pivot;
  let VIDEO_HEIGHT, VIDEO_WIDTH;
  let poseDetector, poses;

  async function runAsyncOperations() {
    let stream, model;
    [stream, model, poseDetector] = await Promise.all([
      getStream(),
      loadModel(MODELS.MASK),
      initPosenet(),
    ]);

    document.querySelector("video").srcObject = stream;
    [VIDEO_WIDTH, VIDEO_HEIGHT] = getPreferredVideoDimensions(stream);
    renderer.setSize(VIDEO_WIDTH, VIDEO_HEIGHT);
    video.width = VIDEO_WIDTH;
    video.height = VIDEO_HEIGHT;
    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;

    [mesh, pivot] = setUpModel(model);
    pivot.add(mesh);
    scene.add(pivot);
    camera = setUpCamera(VIDEO_WIDTH, VIDEO_HEIGHT);
    scene.add(camera);
  }

  async function loadModel(modelName) {
    const gltfLoader = new GLTFLoader();
    return await gltfLoader.loadAsync(PATH + modelName, function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    });
  }

  function setUpCamera(width, height) {
    const camera = new THREE.OrthographicCamera(
      -width / 200,
      width / 200,
      height / 200,
      -height / 200,
      0.1,
      10
    );
    camera.zoom = 0.2;
    camera.position.set(0, 0, 5);
    return camera;
  }

  function setUpModel(model) {
    const mesh = model.scene;
    const box = new THREE.Box3().setFromObject(mesh);
    box.getCenter(mesh.position);
    mesh.position.multiplyScalar(-1);
    const pivot = new THREE.Group();
    return [mesh, pivot];
  }

  function resetContext(ctx, VIDEO_WIDTH, VIDEO_HEIGHT) {
    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.translate(VIDEO_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.save();
    ctx.restore();
    return ctx;
  }

  function getWorldCoords(x, y, height, width, camera) {
    // (-1,1), (1,1), (-1,-1), (1, -1)
    //console.log(`y coords with offset: ${x}`);
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

  // animation loop
  async function animate() {
    requestAnimationFrame(animate);
    ctx = resetContext(ctx, VIDEO_WIDTH, VIDEO_HEIGHT);
    poses = await poseDetector.estimatePoses(video);
    drawKeypoints(ctx, poses);

    if (mesh && pivot && poses) {
      pivot = FaceRotation(pivot, poses);
      pivot.scale.set(scale, scale, scale);

      const meshPosition = Mask(poses, xOffset, yOffset); ////---Mask Model
      //const meshPosition = Glasses(poses, xOffset, yOffset); ////--- Spectacles Model
      //const meshPosition = TraverseBones(mesh, poses, xOffset, yOffset); ////--- Suit Model

      const pos3D = getWorldCoords(
        meshPosition.x,
        meshPosition.y,
        VIDEO_HEIGHT,
        VIDEO_WIDTH,
        camera
      );
      console.log(pos3D);
      pivot.position.set(pos3D.x, pos3D.y, pos3D.z);
    }

    // do the render
    render();

    // update stats
    stats.update();
  }

  // render the scene
  function render() {
    renderer.render(scene, camera);
  }

  onMount(async () => {
    await runAsyncOperations();
    threeContainer.appendChild(canvas);
    document.body.appendChild(stats.domElement);
    webglContainer.appendChild(renderer.domElement);
    document.querySelector("video").addEventListener(
      "loadeddata",
      function () {
        isVideoLoaded = true;
      },
      false
    );
  });

  $: if (isVideoLoaded) {
    animate();
  }

  const handleKeydown = (e) => {
    const arrowKeysEnum = { up: 38, down: 40, left: 37, right: 39 };
    const alphabetsEnum = { p: 80, s: 83, c: 67 };
    Object.freeze(arrowKeysEnum); //Ctrl + arrow keys to change position
    Object.freeze(alphabetsEnum); //Shift + arrow keys to change scaling of model.
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
      scale += deltaFactor * 0.005;
    } else if (e.shiftKey && e.keyCode == arrowKeysEnum.down) {
      scale -= deltaFactor * 0.005;
    }
    if (e.keyCode == alphabetsEnum.c) {
      console.log(`position: ${yOffset}`);
      console.log(`scale: ${scale}`);
    }
  };

  $: console.log(isVideoLoaded);
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
