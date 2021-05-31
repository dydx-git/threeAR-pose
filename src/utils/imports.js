import { onMount } from "svelte";
import * as THREE from "three/build/three.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Stats from "stats.js/build/stats.min.js";
import { drawKeypoints, get2DCanvasContext, drawHome } from "./2DDraw";
import { getStream, getPreferredVideoDimensions } from "./video";
// import { addLights } from "./three";
import { initPosenet, getPart, getFacePose } from "./posenet";
import { getTHREEbasics} from "./three";
import {Mask, Glasses, FaceRotation} from "./Models";
import { get_spread_update } from "svelte/internal";
import { TraverseBones} from "./Models";

export function getImports() {
	return {onMount, 
		THREE, 
		GLTFLoader, 
		Stats, 
		drawKeypoints, 
		getFacePose, 
		getPart, 
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

	};
}
