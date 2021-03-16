<script>
	import { onMount } from "svelte";
	import * as THREE from "three/build/three.module";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
	import Stats from "stats.js/build/stats.min.js";

	let canvas, ctx, stream;
	let stats, scene, renderer;
	let mesh;
	let camera;

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

	onMount(async () => {
		ctx = canvas.getContext("webgl");
		stream = await getMedia({
			video: true, // navigator.mediaDevices.getSupportedConstraints()
		});
		document.querySelector("video").srcObject = stream;
		if (!init()) animate();
	});
</script>

<main>
	<div id="container">
		<video autoplay="true" id="videoElement" />
	</div>
	<canvas width="1280" height="720" bind:this={canvas} />
</main>

<style global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
