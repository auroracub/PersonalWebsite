import * as THREE from 'three';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class Planet {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.mesh = new THREE.Mesh(geometry, material);
    }

    mesh = {
        get prop() {
            return this.mesh;
        }
    }
    
    addToScene(scene) {
        scene.add(this.mesh);

        return this;
    }
}

export class PlanetBuilder {
    #geometry = null
    #material = null

    constructor() {}

    withGeometry(geometry) {
        this.#geometry = geometry;

        return this;
    }

    withMaterial(material) {
        this.#material = material;

        return this;
    }

    build() {
        return new Planet(this.#geometry, this.#material);
    }
}
