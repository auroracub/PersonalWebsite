import * as THREE from 'three';

export default class Render {
    #previousTime;
    #renderLoop;
    clock;
    renderer;

    constructor(scene, camera, renderElement, renderLoop) {
        this.scene = scene;
        this.camera = camera;
        this.clock = new THREE.Clock();
        this.#renderLoop = renderLoop;
        this.renderer = new THREE.WebGLRenderer({
            canvas: renderElement,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(maxPixelRatio);
    }

    loop() {
        this.currentTime = this.clock.getElapsedTime();
        this.deltaTime = this.currentTime - this.#previousTime;

        this.#renderLoop(this.deltaTime);

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.loop.bind(this));

        this.#previousTime = this.currentTime;
    }
}
