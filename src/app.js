import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import Render from './render.js'
import { PlanetBuilder } from './planet.js'
// import loadText from './text.js'
// import { Text } from 'troika-three-text'
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as TWEEN from '@tweenjs/tween.js'

let loaded = false;

// Loading transition
window.addEventListener('load', function() {
    loaded = true;
});


// Disable middle-mouse scrolling
document.body.onmousedown = function(e) { if (e.button === 1) return false; }

// Get Mouse Position
let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener("click", (e) => {
    let screenPos = new THREE.Vector2((e.clientX / window.innerWidth) * 2.0 - 1.0, ((window.innerHeight - e.clientY) / window.innerHeight) * 2.0 - 1.0)
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenPos, camera);
    
    console.log("Click");

    const intersections = raycaster.intersectObjects([ earth.mesh, moon.mesh ]);
    const foundObject = intersections.length > 0;
    
    if (foundObject) {
        console.log("Found Object")
        const intersection = intersections[0];
        const point = intersection.point;
        console.log(point);
        setTarget(intersection.object);
    }
});

const tweenGroup = new TWEEN.Group();

const _VS = `
varying vec3 v_Normal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const _FS = `
varying vec3 v_Normal;

void main() {
    gl_FragColor = vec4(0.4941, 0.7725, 1.0, 1.0);
}`;

// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x415fa6); // Set clear color
// scene.add(new THREE.GridHelper(100, 25));
// scene.add(new THREE.AxesHelper(2.0));

// Create Loaders
// const fileLoader = new THREE.FileLoader();
// const fontLoader = new THREE.FontLoader();
const textureLoader = new THREE.TextureLoader();

// Create Light
const ambientLight = new THREE.AmbientLight(new THREE.Color(0xad5d02), 1.0);
const directionalLight = new THREE.DirectionalLight(new THREE.Color(0xffe8a8), 2.0);
scene.add(ambientLight);
scene.add(directionalLight);

// Create Earth
// earthTexture.repeat.set(2.0, 2.0);
// earthTexture.wrapS = THREE.RepeatWrapping;
// earthTexture.wrapT = THREE.RepeatWrapping;
const earthAlbedo = textureLoader.load("images/textures/fabric-1/fabric-1-color.jpg");
const earthNormal = textureLoader.load("images/textures/fabric-1/fabric-1-normgl.jpg");
const earthDisplacement = textureLoader.load("images/textures/fabric-1/fabric-1-disp.jpg");
const earthRoughness = textureLoader.load("images/textures/fabric-1/fabric-1-rough.jpg");
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

const earth = new PlanetBuilder()
    .withGeometry(new THREE.SphereGeometry(2.5, 64, 64))
    .withMaterial(earthMaterial)
    .build()
    .addToScene(scene)
earth.mesh.position.set(-3.0, -3.0, 0.0);

// Create Moon
const moonAlbedo = textureLoader.load("images/textures/fabric-1/fabric-1-color.jpg");
const moonNormal = textureLoader.load("images/textures/fabric-1/fabric-1-normgl.jpg");
const moonDisplacement = textureLoader.load("images/textures/fabric-1/fabric-1-disp.jpg");
const moonRoughness = textureLoader.load("images/textures/fabric-1/fabric-1-rough.jpg");
const moonMaterial = new THREE.MeshStandardMaterial();
moonMaterial.map = moonAlbedo;
moonMaterial.normalMap = moonNormal;
moonMaterial.dispacementMap = moonDisplacement;
moonMaterial.displacementScale = 1.0;
moonMaterial.roughnessMap = moonRoughness;
moonMaterial.roughness = 0.9;
moonMaterial.color = new THREE.Color(0xD9D9D9);

[ moonAlbedo, moonNormal, moonDisplacement, moonRoughness ].forEach(element => {
    element.repeat.set(8.0, 8.0);
    element.wrapS = THREE.RepeatWrapping;
    element.wrapT = THREE.RepeatWrapping;
});
const moon = new PlanetBuilder()
    .withGeometry(new THREE.SphereGeometry(0.5, 24, 24))
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
const particleMaterials = [
    new THREE.PointsMaterial({
        size: 0.25,
        map: textureLoader.load("images/textures/star-glow-white.png"),
        transparent: true
        // color: 0x44aa88 // remove it if you want white points.
    }),
    new THREE.PointsMaterial({
        size: 0.05,
        map: textureLoader.load("images/textures/star-fuzzy-white.png"),
        transparent: true
        // color: 0x44aa88 // remove it if you want white points.
    })
];
const particleGeometries = [ new THREE.BufferGeometry(), new THREE.BufferGeometry() ];
particleGeometries[0].setAttribute(
    "position",
    new THREE.BufferAttribute(getRandomParticlePos(720, 24.0), 3)
);
particleGeometries[1].setAttribute(
    "position",
    new THREE.BufferAttribute(getRandomParticlePos(512, 32.0), 3)
);
const particleMeshes = [ new THREE.Points(particleGeometries[0], particleMaterials[0]), new THREE.Points(particleGeometries[1], particleMaterials[1]) ];
scene.add(particleMeshes[0]);
scene.add(particleMeshes[1]);

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



// Setup camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 0.125;
camera.position.z = 4.0;

// Setup renderer
const canvas = document.querySelector('canvas.threejs')
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
let targetPosition = new THREE.Vector3(earth.mesh.position.x, earth.mesh.position.y + 2.8, earth.mesh.position.z);
controls.target = targetPosition;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = 1.8;
controls.minDistance = 2.0;
controls.maxDistance = 10.0;
controls.maxTargetRadius = 12.0;
controls.enablePan = false;

function setTarget(object) {
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

const render = new Render(scene, camera, canvas, (_deltaTime) => {
    tweenGroup.update();
    controls.update();
});
window.addEventListener('resize', function() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    // resize only when necessary
    if (needResize) {
        //3rd parameter `false` to change the internal canvas size
        render.renderer.setSize(width, height, false);
        var aspectRatio = width / height;
        
        if (aspectRatio != camera.aspect) {
            camera.aspect = aspectRatio;
            camera.updateProjectionMatrix();
        }
    }
});

render.loop();

// Loading transition

function load() {
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

if (!loaded) {
    window.addEventListener('load', function() {
        loaded = true;
        load();
    });
} else {
    load();
}
