import * as THREE from 'three';
import { CONFIG, getLaneX } from '../config';
import { BoundingBox3D, Lane, ObstacleInstance, ObstacleType, OBSTACLE_TYPE } from '../types';

let obstacleIdCounter = 1;

/**
 * Creates 3D visual mesh for Low Obstacle (fallen mossy jungle log).
 */
function createLowObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'LowObstacle';

  // Log trunk
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.38, CONFIG.OBSTACLES.LOW.WIDTH, 10);
  trunkGeo.rotateZ(Math.PI / 2);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x543d2b });
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
  trunkMesh.position.y = 0.36;
  trunkMesh.castShadow = true;
  group.add(trunkMesh);

  // Moss patch on top
  const mossGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.LOW.WIDTH * 0.75, 0.08, 0.45);
  const mossMat = new THREE.MeshLambertMaterial({ color: 0x3e6b2c });
  const mossMesh = new THREE.Mesh(mossGeo, mossMat);
  mossMesh.position.y = 0.71;
  group.add(mossMesh);

  // Small side branch / vine
  const branchGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6);
  branchGeo.rotateX(0.4);
  const branchMesh = new THREE.Mesh(branchGeo, trunkMat);
  branchMesh.position.set(0.4, 0.5, 0.2);
  group.add(branchMesh);

  return group;
}

/**
 * Creates 3D visual mesh for Overhead Obstacle (ancient temple stone arch beam / hanging barrier).
 */
function createOverheadObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OverheadObstacle';

  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6e685f });
  const mossMat = new THREE.MeshLambertMaterial({ color: 0x475f3a });

  // Left pillar
  const pillarGeo = new THREE.BoxGeometry(0.25, CONFIG.OBSTACLES.OVERHEAD.MAX_Y, 0.35);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-CONFIG.OBSTACLES.OVERHEAD.WIDTH / 2 + 0.12, CONFIG.OBSTACLES.OVERHEAD.MAX_Y / 2, 0);
  group.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(CONFIG.OBSTACLES.OVERHEAD.WIDTH / 2 - 0.12, CONFIG.OBSTACLES.OVERHEAD.MAX_Y / 2, 0);
  group.add(rightPillar);

  // Overhead beam (leaves space underneath: bottom at 1.05m, top at 2.75m)
  const beamHeight = CONFIG.OBSTACLES.OVERHEAD.MAX_Y - CONFIG.OBSTACLES.OVERHEAD.MIN_Y;
  const beamGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.OVERHEAD.WIDTH, beamHeight, CONFIG.OBSTACLES.OVERHEAD.DEPTH);
  const beamMesh = new THREE.Mesh(beamGeo, stoneMat);
  beamMesh.position.set(0, CONFIG.OBSTACLES.OVERHEAD.MIN_Y + beamHeight / 2, 0);
  beamMesh.castShadow = true;
  group.add(beamMesh);

  // Moss and foliage on top of beam
  const foliageGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.OVERHEAD.WIDTH * 0.9, 0.2, CONFIG.OBSTACLES.OVERHEAD.DEPTH * 1.1);
  const foliageMesh = new THREE.Mesh(foliageGeo, mossMat);
  foliageMesh.position.set(0, CONFIG.OBSTACLES.OVERHEAD.MAX_Y + 0.1, 0);
  group.add(foliageMesh);

  return group;
}

/**
 * Creates 3D visual mesh for Full-Lane Blocker (ancient carved stone totem / ruin wall).
 */
function createFullBlockObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FullBlockObstacle';

  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x524b42 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x3d352c });
  const runeMat = new THREE.MeshLambertMaterial({ color: 0x2bb673 }); // glowing ancient jade rune

  // Solid blocker block (fills whole lane from y=0 to y=2.9)
  const mainGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.FULL_BLOCK.WIDTH, CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH);
  const mainMesh = new THREE.Mesh(mainGeo, stoneMat);
  mainMesh.position.y = CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT / 2;
  mainMesh.castShadow = true;
  group.add(mainMesh);

  // Decorative stone cornice
  const corniceGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.FULL_BLOCK.WIDTH + 0.15, 0.25, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH + 0.15);
  const corniceMesh = new THREE.Mesh(corniceGeo, trimMat);
  corniceMesh.position.y = CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT;
  group.add(corniceMesh);

  // Carved rune symbol in center
  const runeGeo = new THREE.BoxGeometry(0.7, 0.7, 0.05);
  const runeMesh = new THREE.Mesh(runeGeo, runeMat);
  runeMesh.position.set(0, 1.5, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH / 2 + 0.02);
  group.add(runeMesh);

  return group;
}

export class ObstacleObject {
  public id: number;
  public type: ObstacleType;
  public lane: Lane;
  public z: number = 0;
  public active: boolean = false;
  public mesh: THREE.Group;

  constructor(type: ObstacleType) {
    this.id = obstacleIdCounter++;
    this.type = type;
    this.lane = 1;

    switch (type) {
      case OBSTACLE_TYPE.LOW:
        this.mesh = createLowObstacleMesh();
        break;
      case OBSTACLE_TYPE.OVERHEAD:
        this.mesh = createOverheadObstacleMesh();
        break;
      case OBSTACLE_TYPE.FULL_BLOCK:
        this.mesh = createFullBlockObstacleMesh();
        break;
    }
    this.mesh.visible = false;
  }

  public activate(lane: Lane, z: number): void {
    this.lane = lane;
    this.z = z;
    this.active = true;
    const x = getLaneX(lane);
    this.mesh.position.set(x, 0, z);
    this.mesh.visible = true;
  }

  public deactivate(): void {
    this.active = false;
    this.mesh.visible = false;
    this.mesh.position.set(0, -100, 0);
  }

  public getInstance(): ObstacleInstance {
    const x = getLaneX(this.lane);
    let minY = 0;
    let maxY = 0;
    let halfWidth = 0;
    let halfDepth = 0;

    switch (this.type) {
      case OBSTACLE_TYPE.LOW:
        minY = CONFIG.OBSTACLES.LOW.MIN_Y;
        maxY = CONFIG.OBSTACLES.LOW.MAX_Y;
        halfWidth = CONFIG.OBSTACLES.LOW.WIDTH / 2;
        halfDepth = CONFIG.OBSTACLES.LOW.DEPTH / 2;
        break;
      case OBSTACLE_TYPE.OVERHEAD:
        minY = CONFIG.OBSTACLES.OVERHEAD.MIN_Y;
        maxY = CONFIG.OBSTACLES.OVERHEAD.MAX_Y;
        halfWidth = CONFIG.OBSTACLES.OVERHEAD.WIDTH / 2;
        halfDepth = CONFIG.OBSTACLES.OVERHEAD.DEPTH / 2;
        break;
      case OBSTACLE_TYPE.FULL_BLOCK:
        minY = CONFIG.OBSTACLES.FULL_BLOCK.MIN_Y;
        maxY = CONFIG.OBSTACLES.FULL_BLOCK.MAX_Y;
        halfWidth = CONFIG.OBSTACLES.FULL_BLOCK.WIDTH / 2;
        halfDepth = CONFIG.OBSTACLES.FULL_BLOCK.DEPTH / 2;
        break;
    }

    const bounds: BoundingBox3D = {
      minX: x - halfWidth,
      maxX: x + halfWidth,
      minY,
      maxY,
      minZ: this.z - halfDepth,
      maxZ: this.z + halfDepth,
    };

    return {
      id: this.id,
      type: this.type,
      lane: this.lane,
      z: this.z,
      active: this.active,
      bounds,
    };
  }
}

/**
 * Object Pool for recycling obstacles without per-frame memory allocation.
 */
export class ObstaclePool {
  private pools: Map<ObstacleType, ObstacleObject[]> = new Map();
  public allObstacles: ObstacleObject[] = [];

  constructor(scene: THREE.Scene, initialPerType: number = 10) {
    const types: ObstacleType[] = [OBSTACLE_TYPE.LOW, OBSTACLE_TYPE.OVERHEAD, OBSTACLE_TYPE.FULL_BLOCK];

    for (const type of types) {
      const list: ObstacleObject[] = [];
      for (let i = 0; i < initialPerType; i++) {
        const obs = new ObstacleObject(type);
        list.push(obs);
        this.allObstacles.push(obs);
        scene.add(obs.mesh);
      }
      this.pools.set(type, list);
    }
  }

  public spawn(type: ObstacleType, lane: Lane, z: number, scene: THREE.Scene): ObstacleObject {
    const pool = this.pools.get(type)!;
    let obs = pool.find((o) => !o.active);

    if (!obs) {
      // Expand pool safely
      obs = new ObstacleObject(type);
      pool.push(obs);
      this.allObstacles.push(obs);
      scene.add(obs.mesh);
    }

    obs.activate(lane, z);
    return obs;
  }

  public getActiveObstacles(): ObstacleObject[] {
    return this.allObstacles.filter((o) => o.active);
  }

  public reset(): void {
    for (const obs of this.allObstacles) {
      obs.deactivate();
    }
  }

  public dispose(scene: THREE.Scene): void {
    for (const obs of this.allObstacles) {
      obs.deactivate();
      scene.remove(obs.mesh);
      obs.mesh.traverse((child) => {
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
    this.allObstacles = [];
    this.pools.clear();
  }
}
