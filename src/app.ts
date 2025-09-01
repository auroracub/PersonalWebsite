////////////////////////////////
// Imports                    //
////////////////////////////////

import * as Three from "three";
import * as Addons from "three/addons";
import * as Tween from "@tweenjs/tween.js"
import { Planet } from "./planet"

////////////////////////////////
// Globals                    //
////////////////////////////////

const DEBUG_MODE = false && process.env.NODE_ENV !== "production";
const labelOffset = 1.25;

let isWindowLoaded = false;
let canvas = <HTMLCanvasElement>document.querySelector("canvas.threejs");
let scene: Three.Scene, camera: Three.PerspectiveCamera, renderer: Three.WebGLRenderer, clock: Three.Clock, controls: Addons.OrbitControls;
let ambientLight: Three.AmbientLight, directionalLight: Three.DirectionalLight;
let earth: Planet, moon: Planet;
let labels: Array<Three.Object3D> = [];

let previousTime = 0.0;
let cursor = new Three.Vector2();
let controlScale = 1.0;

const fontLoader = new Addons.FontLoader();
const ttfLoader = new Addons.TTFLoader();
const textureLoader = new Three.TextureLoader();
const controlsTweenGroup = new Tween.Group();
// const rgbeLoader = new RGBELoader();

const FONTS = {
  interThin: "fonts/Inter/static/Inter_24pt-Thin.ttf",
  interThinItalic: "fonts/Inter/static/Inter_24pt-ThinItalic.ttf",
  interExtraLight: "fonts/Inter/static/Inter_24pt-ExtraLight.ttf",
  interExtraLightItalic: "fonts/Inter/static/Inter_24pt-ExtraLightItalic.ttf",
  interLight: "fonts/Inter/static/Inter_24pt-Light.ttf",
  interLightItalic: "fonts/Inter/static/Inter_24pt-LightItalic.ttf",
  interRegular: "fonts/Inter/static/Inter_24pt-Regular.ttf",
  interRegularItalic: "fonts/Inter/static/Inter_24pt-Italic.ttf",
  interMedium: "fonts/Inter/static/Inter_24pt-Medium.ttf",
  interMediumItalic: "fonts/Inter/static/Inter_24pt-MediumItalic.ttf",
  interSemiBold: "fonts/Inter/static/Inter_24pt-SemiBold.ttf",
  interSemiBoldItalic: "fonts/Inter/static/Inter_24pt-SemiBoldItalic.ttf",
  interBold: "fonts/Inter/static/Inter_24pt-Bold.ttf",
  interBoldItalic: "fonts/Inter/static/Inter_24pt-BoldItalic.ttf",
  interExtraBold: "fonts/Inter/static/Inter_24pt-ExtraBold.ttf",
  interExtraBoldItalic: "fonts/Inter/static/Inter_24pt-ExtraBoldItalic.ttf",
  interBlack: "fonts/Inter/static/Inter_24pt-Black.ttf",
  interBlackItalic: "fonts/Inter/static/Inter_24pt-BlackItalic.ttf",
  reenieBeanieRegular: "fonts/ReenieBeanie/ReenieBeanie-Regular.ttf"
}

////////////////////////////////
// Window Events              //
////////////////////////////////

// Loading transition
window.addEventListener("load", function() {
    isWindowLoaded = true;
});

// Canvas resizing
window.addEventListener("resize", function() {
    const width = canvas === null ? this.window.innerWidth : canvas.clientWidth;
    const height = canvas === null ? this.window.innerHeight : canvas.clientHeight;
    
    // resize only when necessary
    if (canvas.width !== width || canvas.height !== height) {
        // 3rd parameter `false` to change the internal canvas size
        renderer.setSize(width, height, false);
        var aspectRatio = width / height;
        
        if (aspectRatio != camera.aspect) {
            camera.aspect = aspectRatio;
            camera.updateProjectionMatrix();
        }
    };
});

////////////////////////////////
// Input Events               //
////////////////////////////////

// Disable Middle Mouse (Scrolling)
document.body.onmousedown = (e) => {
    if (e.button === 1) return false;
}

// Mouse Move
document.addEventListener("mousemove", (e) => {
    cursor.set(e.clientX, e.clientY);
});

// Click
document.addEventListener("click", (e) => {
    let screenPos = new Three.Vector2((e.clientX / window.innerWidth) * 2.0 - 1.0, ((window.innerHeight - e.clientY) / window.innerHeight) * 2.0 - 1.0)
    const raycaster = new Three.Raycaster(); raycaster.setFromCamera(screenPos, camera);
    const intersections = raycaster.intersectObjects([ earth.mesh, moon.mesh ]);

    // Intersection found
    if (intersections.length > 0) {
        const intersection = intersections[0];

        // Object found
        if (intersection !== null && intersection !== undefined) {
            console.log("Target Changed")
            const point = intersection.point; console.log(point);
            animateControlTarget(intersection.object);
        }
    }
});

// const _VS = `
// varying vec3 v_Normal;
// void main() {
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// }`;
// const _FS = `
// varying vec3 v_Normal;
// void main() {
//     gl_FragColor = vec4(0.4941, 0.7725, 1.0, 1.0);
// }`;

////////////////////////////////
// Init                       //
////////////////////////////////
{
    ////////////////////////////////
    // Camera                     //
    ////////////////////////////////
    
    camera = new Three.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100.0);
    // camera.position.y = 0.125;
    // camera.position.z = 4.0;
    camera.position.set(0.5, -2.5, 1.0);

    ////////////////////////////////
    // Renderer                   //
    ////////////////////////////////

    renderer = new Three.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        // toneMapping: Three.ACESFilmicToneMapping,
        // toneMapping: THREE.NeutralToneMapping,
        // toneMappingExposure: 0.5,
    });

    const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(maxPixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    clock = new Three.Clock();

    ////////////////////////////////
    // Controls                   //
    ////////////////////////////////

    controls = new Addons.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = 1.8;
    controls.enablePan = false;

    ////////////////////////////////
    // Scene                      //
    ////////////////////////////////

    scene = new Three.Scene();
    // scene.background = new THREE.Color(0x415fa6); // Set clear color

    if (DEBUG_MODE) {
        scene.add(new Three.GridHelper(100, 25));
        scene.add(new Three.AxesHelper(2.0));
    }

    // Create Light
    ambientLight = new Three.AmbientLight(new Three.Color(0xad5d02), 1.0);
    directionalLight = new Three.DirectionalLight(new Three.Color(0xffe8a8), 2.0);
    scene.add(ambientLight);
    scene.add(directionalLight);

    const baseDisplacementScale = 0.02;

    // Create Earth
    const earthScale = 1.0;
    const earthAlbedo = textureLoader.load("images/surfaces/fabric-1/fabric-1-color.jpg");
    const earthNormal = textureLoader.load("images/surfaces/fabric-1/fabric-1-normgl.jpg");
    const earthDisplacement = textureLoader.load("images/surfaces/fabric-1/fabric-1-disp.jpg");
    const earthRoughness = textureLoader.load("images/surfaces/fabric-1/fabric-1-rough.jpg");
    const earthMaterial = new Three.MeshStandardMaterial();
    // const earthMaterial = new THREE.ShaderMaterial({
    //         uniforms: {},
    //         vertexShader: _VS,
    //         fragmentShader: _FS
    //     });
    earthMaterial.map = earthAlbedo;
    earthMaterial.normalMap = earthNormal;
    earthMaterial.displacementMap = earthDisplacement;
    earthMaterial.displacementScale = baseDisplacementScale * earthScale;
    earthMaterial.roughnessMap = earthRoughness;
    earthMaterial.roughness = 0.9;
    earthMaterial.color = new Three.Color(0x7EC5FF);

    [ earthAlbedo, earthNormal, earthDisplacement, earthRoughness ].forEach(element => {
        element.repeat.set(8.0, 8.0);
        element.wrapS = Three.RepeatWrapping;
        element.wrapT = Three.RepeatWrapping;
    });
    earth = new Planet(new Three.SphereGeometry(1.0, 64, 64), earthMaterial)
        .addToScene(scene)
    earth.mesh.position.set(0.0, 0.0, 3.0);
    earth.mesh.scale.setScalar(earthScale);

    // Create Moon
    const moonScale = 0.2;
    const moonAlbedo = textureLoader.load("images/surfaces/fabric-1/fabric-1-color.jpg");
    const moonNormal = textureLoader.load("images/surfaces/fabric-1/fabric-1-normgl.jpg");
    const moonDisplacement = textureLoader.load("images/surfaces/fabric-1/fabric-1-disp.jpg");
    const moonRoughness = textureLoader.load("images/surfaces/fabric-1/fabric-1-rough.jpg");
    const moonMaterial = new Three.MeshStandardMaterial();
    moonMaterial.map = moonAlbedo;
    moonMaterial.normalMap = moonNormal;
    moonMaterial.displacementMap = moonDisplacement;
    moonMaterial.displacementScale = baseDisplacementScale * moonScale;
    moonMaterial.roughnessMap = moonRoughness;
    moonMaterial.roughness = 0.9;
    moonMaterial.color = new Three.Color(0xD9D9D9);

    [ moonAlbedo, moonNormal, moonDisplacement, moonRoughness ].forEach(element => {
        element.repeat.set(4.0, 4.0);
        element.wrapS = Three.RepeatWrapping;
        element.wrapT = Three.RepeatWrapping;
    });
    moon = new Planet(new Three.SphereGeometry(1.0, 24, 24), moonMaterial)
        .addToScene(scene)
    moon.mesh.position.set(earth.mesh.position.x + 1.5, earth.mesh.position.y + 4.5, earth.mesh.position.z - 8.0);
    moon.mesh.scale.setScalar(moonScale);

    // Create particles
    const getRandomParticlePos = (particleCount: number, emitterRange: number) => {
        const arrayLength = particleCount * 3;
        const arr = new Float32Array(arrayLength);
        for (let i = 0; i < arrayLength; i++) {
            arr[i] = (Math.random() * 2.0 - 1.0) * emitterRange;
        }
        return arr;
    };
    const particlesMaterial = new Three.PointsMaterial({
        size: 0.25,
        map: textureLoader.load("images/particles/star-glow-white.png"),
        transparent: true
    });
    const particlesGeometry = new Three.BufferGeometry();
    particlesGeometry.setAttribute(
        "position",
        new Three.BufferAttribute(getRandomParticlePos(512, 24.0), 3)
    );
    const particlesMesh = new Three.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);


    // Add more objects here...


    // Create environment

    // const envMap = await rgbeLoader.loadAsync("images/environments/space_rich_multi_nebulae_1.hdr");
    // envMap.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = envMap;
    // scene.environment = envMap;

    // Set Control Target
    const initialTargetPosition = getTargetPosition(earth.mesh, labelOffset);
    controls.target = initialTargetPosition;
    camera.position.add(initialTargetPosition);
    camera.lookAt(initialTargetPosition);
    controls.update();
    setControlScale(earthScale);

    function getTargetPosition(object: Three.Object3D, offset: number) {
        const targetPosition = object.position.clone();
        targetPosition.y += object.scale.y * (Math.sign(offset) * 0.5 + offset);
        return targetPosition;
    }

    // Create Text
    ttfLoader.load(FONTS.interBold, (json) => {
        const interBoldFont = fontLoader.parse(json);
        const baseFontSize = 0.25;
        const baseFontDepth = 0.05;

        // Earth Label
        {
            const textGeometry = new Addons.TextGeometry("Home", {
                font: interBoldFont,
                size: baseFontSize * earthScale,
                depth: baseFontDepth * earthScale,
                curveSegments: 2,
                bevelEnabled: false
            });

            const centerOffset = new Three.Vector3();
            textGeometry.computeBoundingBox();
            textGeometry.boundingBox?.getCenter(centerOffset);
            textGeometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);

            const textMaterial = new Three.MeshBasicMaterial({ color: 0xffffff });
            const textMesh = new Three.Mesh(textGeometry, textMaterial);

            scene.add(textMesh);

            textMesh.position.copy(initialTargetPosition);
            textMesh.lookAt(camera.position);
            labels.push(textMesh);
        }

        // Moon Label
        {
            const textGeometry = new Addons.TextGeometry("About", {
                font: interBoldFont,
                size: baseFontSize * moonScale,
                depth: baseFontDepth * moonScale,
                curveSegments: 2,
                bevelEnabled: false
            });

            const centerOffset = new Three.Vector3();
            textGeometry.computeBoundingBox();
            textGeometry.boundingBox?.getCenter(centerOffset);
            textGeometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);

            const textMaterial = new Three.MeshBasicMaterial({ color: 0xffffff });
            const textMesh = new Three.Mesh(textGeometry, textMaterial);

            scene.add(textMesh);

            textMesh.position.copy(getTargetPosition(moon.mesh, labelOffset));
            textMesh.lookAt(camera.position);
            labels.push(textMesh);
        }
    });
}

////////////////////////////////
// Update                     //
////////////////////////////////

let labelTrackPosition = camera.position.clone();
const labelTrackDamping = 5.0;

function runUpdateLoop() {
    const currentTime = clock.getElapsedTime();
    const deltaTime = currentTime - previousTime;

    ////////////////////////////////
    // Start Update Logic         //
    ////////////////////////////////

    controlsTweenGroup.update();
    controls.update();

    // Label Tracking

    labelTrackPosition.lerp(camera.position, labelTrackDamping * deltaTime);

    labels.forEach((label, _) => {
        label.lookAt(labelTrackPosition);
    });

    ////////////////////////////////
    // End Update Logic           //
    ////////////////////////////////

    renderer.render(scene, camera);
    window.requestAnimationFrame(runUpdateLoop);

    previousTime = currentTime;
}

////////////////////////////////
// Controls                   //
////////////////////////////////

function setControlScale(scale: number) {
    controlScale = scale;
    // controls.minDistance = 1.5 * scale;
    // controls.maxDistance = 12.0 * scale;
    controls.minDistance = 3.0 * scale;
    controls.maxDistance = controls.minDistance;
    // controls.maxTargetRadius = 10.0 * scale;
}

////////////////////////////////
// Scene-specific Logic       //
////////////////////////////////

function animateControlTarget(object: Three.Object3D) {
    const oldScale = controlScale;
    const newScale = object.scale.y;
    const targetPosition = object.position.clone();
    targetPosition.y += newScale * (0.5 + labelOffset);
    controlsTweenGroup.add(new Tween.Tween(controls.target)
        .to(targetPosition, 1500) // Target position and duration in milliseconds
        .easing(Tween.Easing.Quadratic.Out) // Optional easing function for smoother animation
        .onStart(() => {
            // controls.enabled = false;
        })
        .onUpdate((value: Three.Vector3, alpha: number) => {
            // camera.lookAt(controls.target);
            controls.target = value;
            setControlScale(Three.MathUtils.lerp(oldScale, newScale, alpha));
        })
        .onComplete(() => {
            // controls.enabled = true;
        })
        .start())
}

runUpdateLoop();

////////////////////////////////
// Scene Load                 //
////////////////////////////////

function onSceneLoaded() {
    window.setTimeout(function() {
        const loader = document.getElementById("loader");
        
        if (loader) {
            loader.style.opacity = "0.0";
            loader.addEventListener("transitionend", function() {
                loader.remove();
            });
        }

        const content = document.getElementById("content");
        
        if (content) {
            content.style.opacity = "1.0";
            content.style.visibility = "visible";
        }
    }, 100.0);
}

const onWindowLoaded = () => {
    onSceneLoaded();

    // Three.DefaultLoadingManager.onLoad = () => {
    //     // Cleanup from init here...

    //     onSceneLoaded();
    // };
}

if (!isWindowLoaded) {
    window.addEventListener("load", function() {
        isWindowLoaded = true;
        onWindowLoaded();
    });
} else {
    onWindowLoaded();
}
