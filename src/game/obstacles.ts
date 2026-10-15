import * as THREE from 'three';
import { CONFIG, getLaneX } from '../config';
import { BoundingBox3D, Lane, ObstacleInstance, ObstacleType, OBSTACLE_TYPE } from '../types';
import { textureManager } from '../utils/procedural-textures';

let obstacleIdCounter = 1;

/**
 * Creates realistic 3D visual mesh for Low Obstacle (mossy fallen ancient log with vines).
 */
function createLowObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'LowObstacle';

  const barkTex = textureManager.getTreeBarkTexture();
  const logMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x3d6b2c,
    roughness: 0.9,
  });

  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x225518,
    roughness: 0.7,
  });

  // Main fallen log trunk
  const trunkGeo = new THREE.CylinderGeometry(0.36, 0.38, CONFIG.OBSTACLES.LOW.WIDTH, 12);
  trunkGeo.rotateZ(Math.PI / 2);
  const trunkMesh = new THREE.Mesh(trunkGeo, logMat);
  trunkMesh.position.y = 0.37;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // Moss carpet across top of log
  const mossGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.LOW.WIDTH * 0.85, 0.07, 0.48);
  const mossMesh = new THREE.Mesh(mossGeo, mossMat);
  mossMesh.position.y = 0.71;
  mossMesh.castShadow = true;
  group.add(mossMesh);

  // Knotted broken root branches
  const rootGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.7, 6);
  rootGeo.rotateX(0.45);
  const rootMesh = new THREE.Mesh(rootGeo, logMat);
  rootMesh.position.set(0.45, 0.48, 0.22);
  group.add(rootMesh);

  // Hanging jungle vine tendrils
  for (let v = -0.7; v <= 0.7; v += 0.45) {
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 5), vineMat);
    vine.position.set(v, 0.25, 0.32);
    vine.rotation.z = (Math.random() - 0.5) * 0.4;
    group.add(vine);
  }

  return group;
}

/**
 * Creates realistic 3D visual mesh for Overhead Obstacle (ancient temple stone lintel arch).
 */
function createOverheadObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OverheadObstacle';

  const stoneTex = textureManager.getAncientStoneTexture();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x3d6028,
    roughness: 0.9,
  });

  // Left Stone Pillar
  const pillarGeo = new THREE.BoxGeometry(0.26, CONFIG.OBSTACLES.OVERHEAD.MAX_Y, 0.36);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-CONFIG.OBSTACLES.OVERHEAD.WIDTH / 2 + 0.13, CONFIG.OBSTACLES.OVERHEAD.MAX_Y / 2, 0);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  group.add(leftPillar);

  // Right Stone Pillar
  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(CONFIG.OBSTACLES.OVERHEAD.WIDTH / 2 - 0.13, CONFIG.OBSTACLES.OVERHEAD.MAX_Y / 2, 0);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  group.add(rightPillar);

  // Ancient Massive Stone Lintel Beam (leaves space underneath: min 1.05m to max 2.75m)
  const beamHeight = CONFIG.OBSTACLES.OVERHEAD.MAX_Y - CONFIG.OBSTACLES.OVERHEAD.MIN_Y;
  const beamGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.OVERHEAD.WIDTH, beamHeight, CONFIG.OBSTACLES.OVERHEAD.DEPTH);
  const beamMesh = new THREE.Mesh(beamGeo, stoneMat);
  beamMesh.position.set(0, CONFIG.OBSTACLES.OVERHEAD.MIN_Y + beamHeight / 2, 0);
  beamMesh.castShadow = true;
  beamMesh.receiveShadow = true;
  group.add(beamMesh);

  // Moss and foliage overgrowth on top of beam
  const foliageGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.OVERHEAD.WIDTH * 0.95, 0.22, CONFIG.OBSTACLES.OVERHEAD.DEPTH * 1.15);
  const foliageMesh = new THREE.Mesh(foliageGeo, mossMat);
  foliageMesh.position.set(0, CONFIG.OBSTACLES.OVERHEAD.MAX_Y + 0.11, 0);
  group.add(foliageMesh);

  return group;
}

/**
 * Creates realistic 3D visual mesh for Full-Lane Blocker (ancient Mayan stone totem / monolith).
 */
function createFullBlockObstacleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FullBlockObstacle';

  const stoneTex = textureManager.getAncientStoneTexture();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x332e26,
    roughness: 0.8,
  });

  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x2bb673,
    emissive: 0x145a32,
    roughness: 0.3,
  });

  // Solid monolith stone block (fills lane from y=0 to y=2.9)
  const mainGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.FULL_BLOCK.WIDTH, CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH);
  const mainMesh = new THREE.Mesh(mainGeo, stoneMat);
  mainMesh.position.y = CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT / 2;
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  // Stepped temple cornice capital
  const corniceGeo = new THREE.BoxGeometry(CONFIG.OBSTACLES.FULL_BLOCK.WIDTH + 0.16, 0.26, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH + 0.16);
  const corniceMesh = new THREE.Mesh(corniceGeo, trimMat);
  corniceMesh.position.y = CONFIG.OBSTACLES.FULL_BLOCK.HEIGHT;
  corniceMesh.castShadow = true;
  group.add(corniceMesh);

  // Ancient glowing jade sun glyph carving in center
  const runeGeo = new THREE.BoxGeometry(0.75, 0.75, 0.06);
  const runeMesh = new THREE.Mesh(runeGeo, runeMat);
  runeMesh.position.set(0, 1.5, CONFIG.OBSTACLES.FULL_BLOCK.DEPTH / 2 + 0.03);
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
      default:
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
