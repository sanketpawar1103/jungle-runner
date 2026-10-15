import * as THREE from 'three';
import { CONFIG, getLaneX } from '../config';
import { BoundingBox3D, CoinInstance, Lane } from '../types';
import { textureManager } from '../utils/procedural-textures';

let coinIdCounter = 1;

/**
 * Creates realistic ancient golden sun medallion 3D mesh.
 */
function createCoinMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GoldenSunMedallion';

  const coinTex = textureManager.getGoldCoinTexture();

  const goldMat = new THREE.MeshStandardMaterial({
    map: coinTex,
    color: 0xffdf55,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0x442c00,
  });

  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xc99700,
    metalness: 0.95,
    roughness: 0.28,
  });

  // Main coin medallion disc
  const discGeo = new THREE.CylinderGeometry(CONFIG.COINS.RADIUS, CONFIG.COINS.RADIUS, CONFIG.COINS.THICKNESS, 20);
  discGeo.rotateX(Math.PI / 2);
  const discMesh = new THREE.Mesh(discGeo, [edgeMat, goldMat, goldMat]);
  discMesh.castShadow = true;
  group.add(discMesh);

  // Raised beaded outer rim
  const rimGeo = new THREE.TorusGeometry(CONFIG.COINS.RADIUS * 0.9, 0.045, 10, 24);
  const rimMesh = new THREE.Mesh(rimGeo, edgeMat);
  group.add(rimMesh);

  return group;
}

export class CoinObject {
  public id: number;
  public lane: Lane = 1;
  public x: number = 0;
  public y: number = 0;
  public z: number = 0;
  public active: boolean = false;
  public collected: boolean = false;
  public mesh: THREE.Group;

  constructor() {
    this.id = coinIdCounter++;
    this.mesh = createCoinMesh();
    this.mesh.visible = false;
  }

  public activate(lane: Lane, y: number, z: number): void {
    this.lane = lane;
    this.x = getLaneX(lane);
    this.y = y;
    this.z = z;
    this.active = true;
    this.collected = false;

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.visible = true;
    this.mesh.rotation.set(0, 0, 0);
  }

  public deactivate(): void {
    this.active = false;
    this.collected = false;
    this.mesh.visible = false;
    this.mesh.position.set(0, -100, 0);
  }

  public markCollected(): void {
    this.collected = true;
    this.active = false;
    this.mesh.visible = false;
  }

  public updateRotation(dt: number): void {
    if (!this.active || this.collected) return;
    this.mesh.rotation.y += CONFIG.COINS.ROTATION_SPEED * dt;
  }

  public getInstance(): CoinInstance {
    const r = CONFIG.COINS.RADIUS;
    const bounds: BoundingBox3D = {
      minX: this.x - r,
      maxX: this.x + r,
      minY: this.y - r,
      maxY: this.y + r,
      minZ: this.z - r,
      maxZ: this.z + r,
    };

    return {
      id: this.id,
      lane: this.lane,
      x: this.x,
      y: this.y,
      z: this.z,
      collected: this.collected,
      active: this.active,
      bounds,
    };
  }
}

export class CoinPool {
  public pool: CoinObject[] = [];

  constructor(scene: THREE.Scene, initialSize: number = CONFIG.COINS.POOL_SIZE) {
    for (let i = 0; i < initialSize; i++) {
      const coin = new CoinObject();
      this.pool.push(coin);
      scene.add(coin.mesh);
    }
  }

  public spawn(lane: Lane, y: number, z: number, scene: THREE.Scene): CoinObject {
    let coin = this.pool.find((c) => !c.active);
    if (!coin) {
      coin = new CoinObject();
      this.pool.push(coin);
      scene.add(coin.mesh);
    }
    coin.activate(lane, y, z);
    return coin;
  }

  public update(dt: number): void {
    for (const coin of this.pool) {
      if (coin.active) {
        coin.updateRotation(dt);
      }
    }
  }

  public getActiveCoins(): CoinObject[] {
    return this.pool.filter((c) => c.active && !c.collected);
  }

  public reset(): void {
    for (const coin of this.pool) {
      coin.deactivate();
    }
  }

  public dispose(scene: THREE.Scene): void {
    for (const coin of this.pool) {
      coin.deactivate();
      scene.remove(coin.mesh);
      coin.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.pool = [];
  }
}
