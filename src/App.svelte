<script>
	import { onMount } from "svelte";
	import * as THREE from "three/build/three.module";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
	import Stats from "stats.js/build/stats.min.js";
	import { poseNet } from "ml5";

	let canvas, video, stream;
	let stats, scene, renderer;
	let mesh;
	let camera;
	let poseNetModel, poses;

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
					fill(255, 0, 0);
					noStroke();
					ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
				}
			}
		}
	}

	// A function to draw the skeletons
	function drawSkeleton() {
		// Loop through all the skeletons detected
		for (let i = 0; i < poses.length; i++) {
			let skeleton = poses[i].skeleton;
			// For every skeleton, loop through all body connections
			for (let j = 0; j < skeleton.length; j++) {
				let partA = skeleton[j][0];
				let partB = skeleton[j][1];
				stroke(255, 0, 0);
				line(
					partA.position.x,
					partA.position.y,
					partB.position.x,
					partB.position.y
				);
			}
		}
	}

	onMount(async () => {
		// ctx = canvas.getContext("webgl");
		stream = await getMedia({
			video: true, // navigator.mediaDevices.getSupportedConstraints()
		});
		document.querySelector("video").srcObject = stream;
		if (!init()) {
			poseNetModel = poseNet(video, modelLoaded);
			poseNetModel.on("pose", function (results) {
				poses = results;
				console.log(poses);
			});
			loadModels();
			animate();
		}
	});

	// $: if (poses) {
	// 	drawKeypoints();
	// 	drawSkeleton();
	// }
</script>

<main>
	<div id="container">
		<video autoplay="true" id="videoElement" bind:this={video}/>
	</div>
	<canvas width="1280" height="720" bind:this={canvas} />
</main>

<style global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
