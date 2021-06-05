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
    TraverseBones
  } = getImports();

  let scale = 2;

  const PATH = "/assets/models/";
  const MODELS = { MASK: "mask.gltf", SPECTACLES: "glasses/scene.gltf", COSTUME: "alien/alienSuit.gltf" };
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
  let mesh,pivot;
  let VIDEO_HEIGHT, VIDEO_WIDTH;
  let poseDetector, poses;

  async function runAsyncOperations() {
    let stream, model;
    [stream, model, poseDetector] = await Promise.all([
      getStream(),
      loadModel(MODELS.COSTUME),
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
      5
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

  const meshPosition = new THREE.Vector2();
  // animation loop
  async function animate() {
    requestAnimationFrame(animate);
    ctx = resetContext(ctx, VIDEO_WIDTH, VIDEO_HEIGHT);
    poses = await poseDetector.estimatePoses(video);
    drawKeypoints(ctx, poses);

    if (mesh && pivot && poses) {
      
      FaceRotation(pivot, poses);
      pivot.scale.set(scale, scale, scale);

      Mask(poses,VIDEO_WIDTH, VIDEO_HEIGHT, pivot, camera); ////---Mask Model
      //pivot = Glasses(poses,VIDEO_WIDTH, VIDEO_HEIGHT, pivot, camera); ////--- Spectacles Model
      //TraverseBones(pivot, mesh,poses, VIDEO_WIDTH, VIDEO_HEIGHT, camera); ////--- Suit Model
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
    switch (e.keyCode) {
      case 38:
        ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        break;

      case 40:
        //scale -= 0.01;
        break;

      // case 73:
      //   // scale -= 0.01;
      //   console.log(`camera initalized with ${farPlaneFactor}`);
      //   break;

      case 67:
        console.log(`z position: ${pivot.position.z}`);
        console.log(`mesh: ${mesh}`);

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
