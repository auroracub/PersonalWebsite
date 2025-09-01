import * as Three from 'three';

export class Planet {
    mesh: Three.Mesh;

    constructor(geometry: Three.BufferGeometry, material: Three.Material) {
        this.mesh = new Three.Mesh(geometry, material);
    }
    
    addToScene(scene: Three.Scene) {
        scene.add(this.mesh);

        return this;
    }
}
