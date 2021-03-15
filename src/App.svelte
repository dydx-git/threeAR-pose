<script>
	import { onMount } from "svelte";

	let canvas, ctx, stream;

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
	});

	$: console.log(ctx);
</script>

<main>
	<canvas width="1280" height="720" bind:this={canvas} />
</main>

<style global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
