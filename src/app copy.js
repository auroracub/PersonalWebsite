import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const _VS = `
varying vec3 v_Normal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const _FS = `
varying vec3 v_Normal;

void main() {
    gl_FragColor = vec4(v_Normal, 1.0);
}`;

// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set clear color
scene.add(new THREE.GridHelper(100, 25));

// Setup camera
// Perspective camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5.0;
// // Orthographic camera
// const camera = new THREE.OrthographicCamera(
//     -1.0 * aspectRatio,   // Left plane
//     1.0 * aspectRatio,    // Right plane
//     1.0,    // Top plane
//     -1.0,   // Bottom plane
//     0.1,    // Near plane
//     1000.0  // Far plane
// );

// Setup renderer
const canvas = document.querySelector('canvas.threejs')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(maxPixelRatio);
// document.body.appendChild(renderer.domElement);
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    var aspectRatio = window.innerWidth / window.innerHeight;
    
    if (aspectRatio != camera.aspect) {
        camera.aspect = aspectRatio;
        camera.updateProjectionMatrix();
    }
});

// Setup controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.autoRotate = true;

// Create Earth Mesh
const earthGeo = new THREE.SphereGeometry(2.5, 64, 64);
// const earthMat = new THREE.MeshBasicMaterial({ color: 0x7EC5FF });
const earthMat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: _VS,
    fragmentShader: _FS
});
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
earthMesh.position.set(0.0, -3.0, 0.0);
scene.add(earthMesh);

// Create Moon
const moonGeo = new THREE.SphereGeometry(0.75, 24, 24);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xD9D9D9 });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonMesh.position.set(5.0, 3.5, -10.0);
scene.add(moonMesh);

// Create text
const loader = new FontLoader();
loader.load('https://esm.sh/@compai/font-lato/data/typefaces/normal-900.json', function (font) {
    const textGeo = new TextGeometry('Hello, World!', {
        font: font,
        size: 0.3,
        height: 0.25,
        depth: 0.02,
        curveSegments: 4,
        bevelEnabled: false
    });
    textGeo.center();
    const textMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(0.0, 3.5, 0.0);
    // textMesh.castShadow = true;
    earthMesh.add(textMesh);
    // textMesh.lookAt(camera.position)
});

// // Setup light
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// directionalLight.setRotationFromAxisAngle(new THREE.Vector3(0.0, -1.0, 0.0), 0.0);
// scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(2.0);
scene.add(axesHelper);

// Setup clock
const clock = new THREE.Clock();
let previousTime = clock.getElapsedTime();

function render() {
    const currentTime = clock.getElapsedTime();
    const deltaTime = currentTime - previousTime;
    // mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.01;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);

    previousTime = currentTime;
}

render();

// // Framerate-limited render loop

// const frameRate = 60.0;
// const frameTime = 1000.0 / frameRate;

// function render() {
//     setTimeout(function() {
//         // mesh.rotation.x += 0.01;
//         // mesh.rotation.y += 0.01;
//         
//         renderer.render(scene, camera);
//         controls.update();
//
//         requestAnimationFrame(render);
//     }, frameTime);
// }

// render();
