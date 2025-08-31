////////////////////////////////
// Imports                    //
////////////////////////////////

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js'
import { PlanetBuilder } from './planet.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

////////////////////////////////
// Globals                    //
////////////////////////////////

const DEBUG_MODE = false && process.env.NODE_ENV !== 'production';

let isWindowLoaded = false;
let canvas = document.querySelector("canvas.threejs")
let scene, camera, renderer, clock, controls;
let ambientLight, directionalLight;
let earth, moon;

let previousTime = 0.0;
let cursor = new THREE.Vector2();

let pmremGenerator;
// const fileLoader = new THREE.FileLoader();
// const fontLoader = new THREE.FontLoader();
const textureLoader = new THREE.TextureLoader();
const rgbeLoader = new RGBELoader();
const tweenGroup = new TWEEN.Group();

////////////////////////////////
// Window Events              //
////////////////////////////////

// Loading transition
window.addEventListener('load', function() {
    isWindowLoaded = true;
});

// Canvas resizing
window.addEventListener('resize', function() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
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
    let screenPos = new THREE.Vector2((e.clientX / window.innerWidth) * 2.0 - 1.0, ((window.innerHeight - e.clientY) / window.innerHeight) * 2.0 - 1.0)
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenPos, camera);

    const intersections = raycaster.intersectObjects([ earth.mesh, moon.mesh ]);
    const foundObject = intersections.length > 0;
    
    if (foundObject) {
        console.log("Target Changed")
        const intersection = intersections[0];
        const point = intersection.point;
        console.log(point);
        animateControlTarget(intersection.object);
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
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100.0);
    // camera.position.y = 0.125;
    // camera.position.z = 4.0;
    camera.position.set(0.5, -2.5, 1.0);

    ////////////////////////////////
    // Renderer                   //
    ////////////////////////////////
    
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        // toneMapping: THREE.NeutralToneMapping,
        // toneMappingExposure: 0.5,
    });

    const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(maxPixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    clock = new THREE.Clock();

    ////////////////////////////////
    // Controls                   //
    ////////////////////////////////

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = 1.8;
    controls.minDistance = 3.0;
    controls.maxDistance = 15.0;
    controls.maxTargetRadius = 12.0;
    controls.enablePan = false;

    ////////////////////////////////
    // Scene                      //
    ////////////////////////////////

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x415fa6); // Set clear color

    if (DEBUG_MODE) {
        scene.add(new THREE.GridHelper(100, 25));
        scene.add(new THREE.AxesHelper(2.0));
    }

    // Create Light
    ambientLight = new THREE.AmbientLight(new THREE.Color(0xad5d02), 1.0);
    directionalLight = new THREE.DirectionalLight(new THREE.Color(0xffe8a8), 2.0);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Create Earth
    const earthAlbedo = textureLoader.load("images/surfaces/fabric-1/fabric-1-color.jpg");
    const earthNormal = textureLoader.load("images/surfaces/fabric-1/fabric-1-normgl.jpg");
    const earthDisplacement = textureLoader.load("images/surfaces/fabric-1/fabric-1-disp.jpg");
    const earthRoughness = textureLoader.load("images/surfaces/fabric-1/fabric-1-rough.jpg");
    const earthMaterial = new THREE.MeshStandardMaterial();
    // const earthMaterial = new THREE.ShaderMaterial({
    //         uniforms: {},
    //         vertexShader: _VS,
    //         fragmentShader: _FS
    //     });
    earthMaterial.map = earthAlbedo;
    earthMaterial.normalMap = earthNormal;
    earthMaterial.dispacementMap = earthDisplacement;
    earthMaterial.displacementScale = 1.0;
    earthMaterial.roughnessMap = earthRoughness;
    earthMaterial.roughness = 0.9;
    earthMaterial.color = new THREE.Color(0x7EC5FF);

    [ earthAlbedo, earthNormal, earthDisplacement, earthRoughness ].forEach(element => {
        element.repeat.set(8.0, 8.0);
        element.wrapS = THREE.RepeatWrapping;
        element.wrapT = THREE.RepeatWrapping;
    });

    const earthRadius = 2.5;
    earth = new PlanetBuilder()
        .withGeometry(new THREE.SphereGeometry(earthRadius, 64, 64))
        .withMaterial(earthMaterial)
        .build()
        .addToScene(scene)
    earth.mesh.position.set(-3.0, -3.0, 0.0);

    // Create Moon
    const moonAlbedo = textureLoader.load("images/surfaces/fabric-1/fabric-1-color.jpg");
    const moonNormal = textureLoader.load("images/surfaces/fabric-1/fabric-1-normgl.jpg");
    const moonDisplacement = textureLoader.load("images/surfaces/fabric-1/fabric-1-disp.jpg");
    const moonRoughness = textureLoader.load("images/surfaces/fabric-1/fabric-1-rough.jpg");
    const moonMaterial = new THREE.MeshStandardMaterial();
    moonMaterial.map = moonAlbedo;
    moonMaterial.normalMap = moonNormal;
    moonMaterial.dispacementMap = moonDisplacement;
    moonMaterial.displacementScale = 1.0;
    moonMaterial.roughnessMap = moonRoughness;
    moonMaterial.roughness = 0.9;
    moonMaterial.color = new THREE.Color(0xD9D9D9);

    [ moonAlbedo, moonNormal, moonDisplacement, moonRoughness ].forEach(element => {
        element.repeat.set(4.0, 4.0);
        element.wrapS = THREE.RepeatWrapping;
        element.wrapT = THREE.RepeatWrapping;
    });
    const moonRadius = 0.5;
    moon = new PlanetBuilder()
        .withGeometry(new THREE.SphereGeometry(moonRadius, 24, 24))
        .withMaterial(moonMaterial) // new THREE.MeshBasicMaterial({ color: 0xD9D9D9 }))
        .build()
        .addToScene(scene)
    moon.mesh.position.set(earth.mesh.position.x + 3.0, earth.mesh.position.y + 5.0, earth.mesh.position.z - 10.0);

    // Create particles
    const getRandomParticlePos = (particleCount, area) => {
        const arrayLength = particleCount * 3;
        const arr = new Float32Array(arrayLength);
        for (let i = 0; i < arrayLength; i++) {
            arr[i] = (Math.random() * 2.0 - 1.0) * area;
        }
        return arr;
    };
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.25,
        map: textureLoader.load("images/particles/star-glow-white.png"),
        transparent: true
    });
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(getRandomParticlePos(1024, 32.0), 3)
    );
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create environment

    const envMap = await rgbeLoader.loadAsync("images/environments/space_rich_multi_nebulae_1.hdr");
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;

    // pmremGenerator = new THREE.PMREMGenerator(renderer);
    // // pmremGenerator.compileCubemapShader();

    // hdriLoader.load("images/environments/space_rich_multi_nebulae_1.hdr", function (texture) {
    //     const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    //     // envMap.magFilter = THREE.LinearFilter;
    //     // envMap.needsUpdate = true;
    //     scene.environment = envMap
    //     texture.dispose();
    // });

    // hdrCubeMap = new HDRCubeTextureLoader()
    //     .load("images/environments/space_rich_multi_nebulae_1.hdr", function () {
    //         hdrCubeRenderTarget = pmremGenerator.fromCubemap( hdrCubeMap );
    //         hdrCubeMap.magFilter = THREE.LinearFilter;
    //         hdrCubeMap.needsUpdate = true;
    //     });

    // // Create Text
    // const myText = new Text()
    // scene.add(myText)
    // // Set properties to configure:
    // myText.text = "Hello world!"
    // // myText.font = "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
    // myText.fontSize = 0.2
    // myText.position.z = -2
    // myText.color = 0x9966FF
    // // Update the rendering:
    // myText.sync()
    // const interMediumFont = "https://esm.sh/@compai/font-inter/data/typefaces/normal-700.json"
    // const reenieBeanieRegularFont = "https://esm.sh/@compai/font-reenie-beanie/data/typefaces/normal-400.json"
    // let earthHeading;
    // loadText("Hej, I'm AJ", 0.3, 0.25, interMediumFont, (geometry) => {
    //     geometry.center()
    //     const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    //     earthHeading = new THREE.Mesh(geometry, material);
    //     earthHeading.position.set(0.0, 3.5, 0.0);
    //     earth.mesh.add(earthHeading);
    // });
    // let earthSubheading;
    // loadText([
    //     "-> Technical Art",
    //     "-> Design",
    //     "-> Game Dev"
    // ].join("\n"), 0.12, 0.25, interMediumFont, (geometry) => {
    //     geometry.center()
    //     const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    //     earthSubheading = new THREE.Mesh(geometry, material);
    //     earthSubheading.position.set(0.0, -1.0, 0.0);
    //     earthHeading.add(earthSubheading);
    // });
    // Add more objects here...

    // Set Control Target
    const targetPosition = earth.mesh.position.clone();
    targetPosition.y += earthRadius + 1.0;
    controls.target = targetPosition;
    camera.position.add(targetPosition);
    camera.lookAt(targetPosition);
}

////////////////////////////////
// Update                     //
////////////////////////////////
function runUpdateLoop() {
    const currentTime = clock.getElapsedTime();
    const deltaTime = currentTime - previousTime;

    // Start Update Logic

    tweenGroup.update();
    controls.update();

    // End Update Logic

    renderer.render(scene, camera);
    window.requestAnimationFrame(runUpdateLoop);

    previousTime = currentTime;
}

////////////////////////////////
// Scene-specific Logic       //
////////////////////////////////
function animateControlTarget(object) {
    tweenGroup.add(new TWEEN.Tween(controls.target)
        .to(object.position, 2000) // Target position and duration in milliseconds
        .easing(TWEEN.Easing.Quadratic.Out) // Optional easing function for smoother animation
        .onStart(() => {
            // controls.enabled = false;
        })
        .onUpdate((value, _) => {
            // camera.lookAt(controls.target);
            controls.target = value;
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
        document.getElementById("content").style.opacity = 1.0;
        document.getElementById("content").style.visibility = "visible";
        document.getElementById("loader").style.opacity = 0.0;
        
        // Optional: Remove the loader from the DOM after the transition
        loader.addEventListener("transitionend", function() {
            loader.remove();
        });
    }, 100.0);
}

const onWindowLoaded = () => {
    THREE.DefaultLoadingManager.onLoad = () => {
        // Cleanup from init here...

        onSceneLoaded();
    };
}

if (!isWindowLoaded) {
    window.addEventListener('load', function() {
        isWindowLoaded = true;
        onWindowLoaded();
    });
} else {
    onWindowLoaded();
}
