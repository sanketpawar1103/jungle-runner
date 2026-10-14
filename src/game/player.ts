import * as THREE from 'three';
import { CONFIG, getLaneX } from '../config';
import { BoundingBox3D, Lane, LANE, PlayerCollisionState, VerticalAction } from '../types';

export interface PlayerCallbacks {
  onGameOver: (reason: string) => void;
  onLaneSwitch?: () => void;
  onJump?: () => void;
  onSlide?: () => void;
}

/**
 * Player controller and procedural 3D stylized jungle explorer character.
 */
export class Player {
  public mesh: THREE.Group;
  public lane: Lane = LANE.MIDDLE;
  public targetLane: Lane = LANE.MIDDLE;
  public x: number = 0;
  public y: number = 0;
  public z: number = 0;

  public action: VerticalAction = 'NONE';
  public actionTimer: number = 0;
  public actionDuration: number = 0;

  public isAlive: boolean = true;
  private runAnimTime: number = 0;

  // Visual sub-meshes for procedural character animation
  private rootGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private hatGroup: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;

  private callbacks: PlayerCallbacks;

  // Shared reusable materials & geometries
  private static sharedMaterials: {
    skin: THREE.MeshLambertMaterial;
    jacket: THREE.MeshLambertMaterial;
    pants: THREE.MeshLambertMaterial;
    boots: THREE.MeshLambertMaterial;
    hat: THREE.MeshLambertMaterial;
    hatBand: THREE.MeshLambertMaterial;
    belt: THREE.MeshLambertMaterial;
    buckle: THREE.MeshLambertMaterial;
  } | null = null;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
    this.mesh = new THREE.Group();
    this.mesh.name = 'Player';

    Player.initSharedMaterials();
    const mats = Player.sharedMaterials!;

    this.rootGroup = new THREE.Group();
    this.mesh.add(this.rootGroup);

    // Explorer Torso (Safari jacket)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    this.torsoMesh = new THREE.Mesh(torsoGeo, mats.jacket);
    this.torsoMesh.position.y = 1.05;
    this.torsoMesh.castShadow = true;
    this.rootGroup.add(this.torsoMesh);

    // Belt & Buckle
    const beltGeo = new THREE.BoxGeometry(0.57, 0.1, 0.37);
    const beltMesh = new THREE.Mesh(beltGeo, mats.belt);
    beltMesh.position.y = -0.25;
    this.torsoMesh.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.18, 0.12, 0.39);
    const buckleMesh = new THREE.Mesh(buckleGeo, mats.buckle);
    buckleMesh.position.y = -0.25;
    this.torsoMesh.add(buckleMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    this.headMesh = new THREE.Mesh(headGeo, mats.skin);
    this.headMesh.position.y = 0.52;
    this.torsoMesh.add(this.headMesh);

    // Explorer Fedora / Hat
    this.hatGroup = new THREE.Group();
    const brimGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.05, 12);
    const brimMesh = new THREE.Mesh(brimGeo, mats.hat);
    this.hatGroup.add(brimMesh);

    const crownGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 12);
    crownGeo.translate(0, 0.12, 0);
    const crownMesh = new THREE.Mesh(crownGeo, mats.hat);
    this.hatGroup.add(crownMesh);

    const hatBandGeo = new THREE.CylinderGeometry(0.26, 0.285, 0.06, 12);
    hatBandGeo.translate(0, 0.05, 0);
    const hatBandMesh = new THREE.Mesh(hatBandGeo, mats.hatBand);
    this.hatGroup.add(hatBandMesh);

    this.hatGroup.position.y = 0.22;
    this.headMesh.add(this.hatGroup);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.16);
    armGeo.translate(0, -0.24, 0);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.35, 0.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, mats.jacket);
    this.leftArm.add(leftArmMesh);
    this.torsoMesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.35, 0.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, mats.jacket);
    this.rightArm.add(rightArmMesh);
    this.torsoMesh.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.22);
    legGeo.translate(0, -0.32, 0);

    const bootGeo = new THREE.BoxGeometry(0.22, 0.2, 0.3);
    bootGeo.translate(0, -0.55, 0.04);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, mats.pants);
    const leftBootMesh = new THREE.Mesh(bootGeo, mats.boots);
    this.leftLeg.add(leftLegMesh);
    this.leftLeg.add(leftBootMesh);
    this.rootGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, mats.pants);
    const rightBootMesh = new THREE.Mesh(bootGeo, mats.boots);
    this.rightLeg.add(rightLegMesh);
    this.rightLeg.add(rightBootMesh);
    this.rootGroup.add(this.rightLeg);

    this.reset();
  }

  private static initSharedMaterials(): void {
    if (Player.sharedMaterials) return;
    Player.sharedMaterials = {
      skin: new THREE.MeshLambertMaterial({ color: 0xe0a97a }),
      jacket: new THREE.MeshLambertMaterial({ color: 0x8a7248 }), // Tan safari jacket
      pants: new THREE.MeshLambertMaterial({ color: 0x48523b }), // Olive cargo pants
      boots: new THREE.MeshLambertMaterial({ color: 0x2b1e16 }), // Dark leather boots
      hat: new THREE.MeshLambertMaterial({ color: 0x9c8357 }), // Fedora hat
      hatBand: new THREE.MeshLambertMaterial({ color: 0x1f1912 }), // Dark hat band
      belt: new THREE.MeshLambertMaterial({ color: 0x3d281a }),
      buckle: new THREE.MeshLambertMaterial({ color: 0xd4af37 }), // Gold buckle
    };
  }

  /**
   * Resets player state to middle lane and standing running position.
   */
  public reset(): void {
    this.lane = LANE.MIDDLE;
    this.targetLane = LANE.MIDDLE;
    this.x = getLaneX(LANE.MIDDLE);
    this.y = 0;
    this.z = 0;
    this.action = 'NONE';
    this.actionTimer = 0;
    this.actionDuration = 0;
    this.isAlive = true;
    this.runAnimTime = 0;

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.set(0, 0, 0);
    this.rootGroup.position.set(0, 0, 0);
    this.rootGroup.rotation.set(0, 0, 0);
    this.torsoMesh.position.y = 1.05;
    this.torsoMesh.rotation.set(0, 0, 0);
    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);
    this.leftLeg.rotation.set(0, 0, 0);
    this.rightLeg.rotation.set(0, 0, 0);
  }

  /**
   * Handles lane change input: Left.
   */
  public handleLeft(): void {
    if (!this.isAlive) return;

    if (this.targetLane === LANE.LEFT) {
      // Out of bounds rule: pressing Left while in leftmost lane causes game over immediately
      this.isAlive = false;
      this.callbacks.onGameOver('Fell off the left side of the track!');
      return;
    }

    this.targetLane = (this.targetLane - 1) as Lane;
    this.callbacks.onLaneSwitch?.();
  }

  /**
   * Handles lane change input: Right.
   */
  public handleRight(): void {
    if (!this.isAlive) return;

    if (this.targetLane === LANE.RIGHT) {
      // Out of bounds rule: pressing Right while in rightmost lane causes game over immediately
      this.isAlive = false;
      this.callbacks.onGameOver('Fell off the right side of the track!');
      return;
    }

    this.targetLane = (this.targetLane + 1) as Lane;
    this.callbacks.onLaneSwitch?.();
  }

  /**
   * Handles Jump input (Up arrow).
   * Up during slide cancels slide and starts jump immediately.
   */
  public handleJump(): void {
    if (!this.isAlive) return;

    // Start or cancel-into jump
    this.action = 'JUMPING';
    this.actionTimer = 0;
    this.actionDuration = CONFIG.PLAYER.JUMP_DURATION;
    this.callbacks.onJump?.();
  }

  /**
   * Handles Slide input (Down arrow).
   * Down during jump cancels jump and starts slide immediately.
   */
  public handleSlide(): void {
    if (!this.isAlive) return;

    // Start or cancel-into slide
    this.action = 'SLIDING';
    this.actionTimer = 0;
    this.actionDuration = CONFIG.PLAYER.SLIDE_DURATION;
    this.y = 0;
    this.callbacks.onSlide?.();
  }

  /**
   * Frame update with frame-rate-independent delta time.
   */
  public update(dt: number, currentSpeed: number): void {
    const safeDt = dt;

    if (!this.isAlive) {
      // Death tumble animation
      this.rootGroup.rotation.x = THREE.MathUtils.lerp(this.rootGroup.rotation.x, -Math.PI / 2.2, 8 * safeDt);
      this.rootGroup.position.y = THREE.MathUtils.lerp(this.rootGroup.position.y, 0.3, 8 * safeDt);
      return;
    }

    // 1. Smooth lane transition
    const targetX = getLaneX(this.targetLane);
    const switchSpeed = 1.0 / CONFIG.LANE_SWITCH_DURATION;
    this.x = THREE.MathUtils.damp(this.x, targetX, switchSpeed * 3, safeDt);

    // Update actual current lane once close to target
    if (Math.abs(this.x - targetX) < 0.15) {
      this.lane = this.targetLane;
    }

    // Slight banking roll during lane switch
    const xDiff = targetX - this.x;
    this.rootGroup.rotation.z = -xDiff * 0.15;

    // 2. Vertical Action (Jump or Slide)
    if (this.action === 'JUMPING') {
      this.actionTimer += safeDt;
      const progress = this.actionTimer / this.actionDuration;

      if (progress >= 1.0) {
        // Jump completed cleanly
        this.action = 'NONE';
        this.y = 0;
        this.actionTimer = 0;
      } else {
        // Smooth parabolic jump arc: peak at t = 0.5
        this.y = CONFIG.PLAYER.JUMP_HEIGHT * Math.sin(Math.PI * progress);
      }
    } else if (this.action === 'SLIDING') {
      this.actionTimer += safeDt;
      const progress = this.actionTimer / this.actionDuration;

      if (progress >= 1.0) {
        // Slide completed cleanly
        this.action = 'NONE';
        this.y = 0;
        this.actionTimer = 0;
      } else {
        this.y = 0;
      }
    } else {
      this.y = 0;
    }

    // 3. Update Mesh Positions & Procedural Animations
    this.mesh.position.set(this.x, this.y, this.z);

    if (this.action === 'JUMPING') {
      // Jump pose: legs bent, arms out
      this.torsoMesh.position.y = 1.05;
      this.torsoMesh.rotation.x = 0.1;
      this.leftLeg.rotation.x = -0.6;
      this.rightLeg.rotation.x = -0.5;
      this.leftArm.rotation.x = 0.9;
      this.rightArm.rotation.x = 0.9;
      this.rootGroup.position.y = 0;
    } else if (this.action === 'SLIDING') {
      // Slide pose: low to ground, legs forward, torso leaning back
      this.torsoMesh.position.y = 0.55;
      this.torsoMesh.rotation.x = -0.8;
      this.leftLeg.rotation.x = 1.2;
      this.rightLeg.rotation.x = 1.3;
      this.leftArm.rotation.x = -0.5;
      this.rightArm.rotation.x = -0.5;
      this.rootGroup.position.y = -0.2;
    } else {
      // Natural running cycle
      this.runAnimTime += safeDt * (currentSpeed / CONFIG.SPEED.INITIAL) * CONFIG.PLAYER.RUN_CYCLE_SPEED;
      const legAngle = Math.sin(this.runAnimTime) * 0.75;
      const armAngle = -legAngle * 0.85;

      this.torsoMesh.position.y = 1.05 + Math.abs(Math.sin(this.runAnimTime * 2)) * 0.08;
      this.torsoMesh.rotation.x = 0.12; // slight forward sprint lean
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;
      this.rootGroup.position.y = 0;
    }
  }

  /**
   * Calculates the exact 3D bounding box for collision detection.
   * Accurately reflects standing, jumping elevation, and sliding low height.
   */
  public getCollisionState(): PlayerCollisionState {
    const isSliding = this.action === 'SLIDING';
    const height = isSliding ? CONFIG.PLAYER.SLIDE_HEIGHT : CONFIG.PLAYER.STAND_HEIGHT;
    const depth = isSliding ? CONFIG.PLAYER.SLIDE_DEPTH : CONFIG.PLAYER.DEPTH;
    const width = CONFIG.PLAYER.WIDTH;

    const bounds: BoundingBox3D = {
      minX: this.x - width / 2,
      maxX: this.x + width / 2,
      minY: this.y,
      maxY: this.y + height,
      minZ: this.z - depth / 2,
      maxZ: this.z + depth / 2,
    };

    return {
      lane: this.lane,
      x: this.x,
      y: this.y,
      z: this.z,
      action: this.action,
      bounds,
    };
  }

  /**
   * Triggers player death from external collision.
   */
  public kill(reason: string): void {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.callbacks.onGameOver(reason);
  }
}
