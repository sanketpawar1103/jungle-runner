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
 * High-realism Jungle Survivor Character.
 *
 * Visual design — Tarzan-inspired rugged explorer:
 * - Realistic human anatomy with smooth high-segment geometry
 * - MeshPhysicalMaterial skin with sheen for subsurface-scattering approximation
 * - Tanned bronzed skin, athletic muscular build
 * - Wild dark curly hair with layered plane strands
 * - Torn, earth-toned cargo pants cut off at the knee
 * - Open ragged vest/harness with leather strap detail
 * - Forearm wraps and bare feet with ankle cord
 * - Fully animated: run, jump, slide, death
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

  // ── Rig groups ───────────────────────────────────────────────
  private rootGroup: THREE.Group;
  private spineGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private hairGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftKneeGroup: THREE.Group;
  private rightKneeGroup: THREE.Group;
  private vestFlapL: THREE.Mesh;
  private vestFlapR: THREE.Mesh;

  private callbacks: PlayerCallbacks;

  // ── Shared PBR materials (singleton per session) ─────────────
  private static sharedMaterials: {
    skin: THREE.MeshPhysicalMaterial;
    darkSkin: THREE.MeshPhysicalMaterial;
    hair: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    vest: THREE.MeshStandardMaterial;
    leatherWrap: THREE.MeshStandardMaterial;
    eyeWhite: THREE.MeshStandardMaterial;
    eyePupil: THREE.MeshStandardMaterial;
    tooth: THREE.MeshStandardMaterial;
  } | null = null;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
    this.mesh = new THREE.Group();
    this.mesh.name = 'JungleSurvivor';

    Player.initSharedMaterials();
    const m = Player.sharedMaterials!;

    // ── Root & Spine ──────────────────────────────────────────
    this.rootGroup = new THREE.Group();
    this.mesh.add(this.rootGroup);

    this.spineGroup = new THREE.Group();
    this.spineGroup.position.y = 0.98;
    this.rootGroup.add(this.spineGroup);

    // ── Pelvis ───────────────────────────────────────────────
    const pelvisGeo = new THREE.CapsuleGeometry(0.21, 0.14, 6, 10);
    const pelvis = new THREE.Mesh(pelvisGeo, m.skin);
    pelvis.position.set(0, -0.01, 0);
    pelvis.castShadow = true;
    this.spineGroup.add(pelvis);

    // ── Torso Group ──────────────────────────────────────────
    this.torsoGroup = new THREE.Group();
    this.spineGroup.add(this.torsoGroup);

    // Lower abdomen
    const abdomenGeo = new THREE.CapsuleGeometry(0.2, 0.2, 8, 12);
    const abdomen = new THREE.Mesh(abdomenGeo, m.skin);
    abdomen.position.set(0, 0.15, 0.01);
    abdomen.castShadow = true;
    this.torsoGroup.add(abdomen);

    // Upper ribcage — wide athletic chest
    const chestGeo = new THREE.CapsuleGeometry(0.235, 0.32, 8, 14);
    const chest = new THREE.Mesh(chestGeo, m.skin);
    chest.position.set(0, 0.38, 0.01);
    chest.scale.set(1.05, 1.0, 0.88);
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    // Pectorals
    const pecGeo = new THREE.SphereGeometry(0.125, 10, 8);
    pecGeo.scale(1.25, 0.72, 0.65);
    const leftPec = new THREE.Mesh(pecGeo, m.skin);
    leftPec.position.set(-0.115, 0.44, 0.16);
    this.torsoGroup.add(leftPec);
    const rightPec = new THREE.Mesh(pecGeo, m.skin);
    rightPec.position.set(0.115, 0.44, 0.16);
    this.torsoGroup.add(rightPec);

    // Abdominal detail (subtle)
    const abGeo = new THREE.SphereGeometry(0.058, 7, 6);
    abGeo.scale(1.0, 0.6, 0.35);
    for (let row = 0; row < 3; row++) {
      const yPos = 0.3 - row * 0.09;
      const zPos = 0.185 - row * 0.01;
      [-0.062, 0.062].forEach((xOff) => {
        const ab = new THREE.Mesh(abGeo, m.skin);
        ab.position.set(xOff, yPos, zPos);
        this.torsoGroup.add(ab);
      });
    }

    // Trapezius / upper-back width
    const trapGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 8);
    trapGeo.rotateZ(Math.PI / 2);
    const trap = new THREE.Mesh(trapGeo, m.skin);
    trap.position.set(0, 0.52, -0.06);
    trap.scale.set(1.0, 0.7, 0.8);
    this.torsoGroup.add(trap);

    // ── Open Ragged Vest ─────────────────────────────────────
    // Left vest flap (hangs slightly open)
    const vestFlapGeo = new THREE.BoxGeometry(0.24, 0.42, 0.04);
    this.vestFlapL = new THREE.Mesh(vestFlapGeo, m.vest);
    this.vestFlapL.position.set(-0.1, 0.36, 0.17);
    this.vestFlapL.rotation.z = 0.12;
    this.vestFlapL.castShadow = true;
    this.torsoGroup.add(this.vestFlapL);

    this.vestFlapR = new THREE.Mesh(vestFlapGeo, m.vest);
    this.vestFlapR.position.set(0.1, 0.36, 0.17);
    this.vestFlapR.rotation.z = -0.12;
    this.vestFlapR.castShadow = true;
    this.torsoGroup.add(this.vestFlapR);

    // Leather shoulder straps (like a harness)
    const strapGeo = new THREE.BoxGeometry(0.07, 0.38, 0.06);
    const strapL = new THREE.Mesh(strapGeo, m.leatherWrap);
    strapL.position.set(-0.18, 0.46, 0.1);
    strapL.rotation.z = 0.18;
    this.torsoGroup.add(strapL);
    const strapR = new THREE.Mesh(strapGeo, m.leatherWrap);
    strapR.position.set(0.18, 0.46, 0.1);
    strapR.rotation.z = -0.18;
    this.torsoGroup.add(strapR);

    // Cross-chest belt strap
    const crossBeltGeo = new THREE.BoxGeometry(0.52, 0.055, 0.055);
    const crossBelt = new THREE.Mesh(crossBeltGeo, m.leatherWrap);
    crossBelt.position.set(0, 0.3, 0.16);
    this.torsoGroup.add(crossBelt);

    // ── Head & Face ──────────────────────────────────────────
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.68, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck — slightly muscular
    const neckGeo = new THREE.CylinderGeometry(0.09, 0.115, 0.2, 10);
    const neck = new THREE.Mesh(neckGeo, m.skin);
    neck.position.set(0, 0.06, 0.01);
    neck.castShadow = true;
    this.headGroup.add(neck);

    // Head base — elongated capsule for realistic skull shape
    const headGeo = new THREE.CapsuleGeometry(0.13, 0.17, 8, 12);
    const headMesh = new THREE.Mesh(headGeo, m.skin);
    headMesh.position.set(0, 0.22, 0.01);
    headMesh.scale.set(0.93, 1.0, 0.88);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Jaw / chin — wider lower face
    const jawGeo = new THREE.SphereGeometry(0.11, 8, 6);
    jawGeo.scale(1.1, 0.62, 0.92);
    const jaw = new THREE.Mesh(jawGeo, m.skin);
    jaw.position.set(0, 0.15, 0.06);
    this.headGroup.add(jaw);

    // Brow ridge — adds masculine depth
    const browGeo = new THREE.CapsuleGeometry(0.075, 0.16, 5, 6);
    browGeo.rotateZ(Math.PI / 2);
    const brow = new THREE.Mesh(browGeo, m.darkSkin);
    brow.position.set(0, 0.285, 0.11);
    brow.scale.set(1.0, 0.4, 0.5);
    this.headGroup.add(brow);

    // Nose bridge
    const noseGeo = new THREE.BoxGeometry(0.04, 0.075, 0.052);
    const nose = new THREE.Mesh(noseGeo, m.skin);
    nose.position.set(0, 0.215, 0.13);
    this.headGroup.add(nose);

    // Nose tip
    const noseTipGeo = new THREE.SphereGeometry(0.03, 6, 5);
    noseTipGeo.scale(1.3, 0.85, 1.2);
    const noseTip = new THREE.Mesh(noseTipGeo, m.skin);
    noseTip.position.set(0, 0.18, 0.145);
    this.headGroup.add(noseTip);

    // Eyes — whites + dark pupils
    const eyeWhiteGeo = new THREE.SphereGeometry(0.025, 7, 6);
    const eyePupilGeo = new THREE.SphereGeometry(0.014, 6, 5);

    const leftEyeW = new THREE.Mesh(eyeWhiteGeo, m.eyeWhite);
    leftEyeW.position.set(-0.055, 0.265, 0.115);
    leftEyeW.scale.set(1.0, 0.75, 0.6);
    this.headGroup.add(leftEyeW);

    const leftEyeP = new THREE.Mesh(eyePupilGeo, m.eyePupil);
    leftEyeP.position.set(-0.055, 0.264, 0.125);
    leftEyeP.scale.set(1.0, 0.75, 0.5);
    this.headGroup.add(leftEyeP);

    const rightEyeW = new THREE.Mesh(eyeWhiteGeo, m.eyeWhite);
    rightEyeW.position.set(0.055, 0.265, 0.115);
    rightEyeW.scale.set(1.0, 0.75, 0.6);
    this.headGroup.add(rightEyeW);

    const rightEyeP = new THREE.Mesh(eyePupilGeo, m.eyePupil);
    rightEyeP.position.set(0.055, 0.264, 0.125);
    rightEyeP.scale.set(1.0, 0.75, 0.5);
    this.headGroup.add(rightEyeP);

    // ── Wild Hair System ─────────────────────────────────────
    this.hairGroup = new THREE.Group();
    this.headGroup.add(this.hairGroup);

    // Dense hair cap covering skull
    const hairCapGeo = new THREE.SphereGeometry(0.155, 10, 9);
    hairCapGeo.scale(1.02, 1.05, 1.1);
    hairCapGeo.translate(0, 0.24, -0.01);
    const hairCap = new THREE.Mesh(hairCapGeo, m.hair);
    this.hairGroup.add(hairCap);

    // Back mane — thick flowing dark mass
    const maneGeo = new THREE.CapsuleGeometry(0.115, 0.52, 6, 10);
    maneGeo.translate(0, 0.05, -0.14);
    maneGeo.rotateX(0.18);
    const mane = new THREE.Mesh(maneGeo, m.hair);
    mane.castShadow = true;
    this.hairGroup.add(mane);

    // Lower back hair extension
    const lowerManeGeo = new THREE.CapsuleGeometry(0.075, 0.38, 5, 8);
    lowerManeGeo.translate(0, -0.24, -0.2);
    lowerManeGeo.rotateX(0.12);
    const lowerMane = new THREE.Mesh(lowerManeGeo, m.hair);
    this.hairGroup.add(lowerMane);

    // Side curly locks falling over temples
    const lockGeo = new THREE.CapsuleGeometry(0.04, 0.28, 5, 7);

    const positions: [number, number, number, number][] = [
      [-0.14, 0.08, 0.02, -0.25],
      [-0.13, 0.04, -0.09, -0.18],
      [0.14, 0.08, 0.02, 0.25],
      [0.13, 0.04, -0.09, 0.18],
    ];
    positions.forEach(([x, y, z, rz]) => {
      const lock = new THREE.Mesh(lockGeo, m.hair);
      lock.position.set(x, y, z);
      lock.rotation.z = rz;
      this.hairGroup.add(lock);
    });

    // ── Arms ─────────────────────────────────────────────────
    const deltoidGeo = new THREE.SphereGeometry(0.1, 10, 8);
    deltoidGeo.scale(1.05, 1.15, 0.95);
    const upperArmGeo = new THREE.CapsuleGeometry(0.08, 0.3, 8, 10);
    upperArmGeo.translate(0, -0.18, 0);
    const bicepBulgeGeo = new THREE.SphereGeometry(0.092, 8, 7);
    bicepBulgeGeo.scale(0.9, 0.7, 0.65);

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.33, 0.46, 0);
    const lDeltoid = new THREE.Mesh(deltoidGeo, m.skin);
    this.leftArmGroup.add(lDeltoid);
    const lUpperArm = new THREE.Mesh(upperArmGeo, m.skin);
    lUpperArm.castShadow = true;
    this.leftArmGroup.add(lUpperArm);
    const lBicep = new THREE.Mesh(bicepBulgeGeo, m.skin);
    lBicep.position.set(0.02, -0.14, 0.06);
    this.leftArmGroup.add(lBicep);
    // Bicep band
    const bicepBandGeo = new THREE.CylinderGeometry(0.086, 0.086, 0.065, 10);
    const lBand = new THREE.Mesh(bicepBandGeo, m.leatherWrap);
    lBand.position.set(0, -0.12, 0);
    this.leftArmGroup.add(lBand);
    this.torsoGroup.add(this.leftArmGroup);

    // Left Forearm
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.32, 0);
    const lForearmGeo = new THREE.CapsuleGeometry(0.072, 0.26, 8, 10);
    lForearmGeo.translate(0, -0.15, 0);
    const lForearm = new THREE.Mesh(lForearmGeo, m.skin);
    lForearm.castShadow = true;
    this.leftForearmGroup.add(lForearm);
    // Wrist wrap — several rings of cloth
    for (let w = 0; w < 3; w++) {
      const wrapGeo = new THREE.CylinderGeometry(0.077 - w * 0.002, 0.077 - w * 0.002, 0.045, 9);
      const wrapRing = new THREE.Mesh(wrapGeo, m.leatherWrap);
      wrapRing.position.set(0, -0.27 - w * 0.045, 0);
      this.leftForearmGroup.add(wrapRing);
    }
    const lHandGeo = new THREE.SphereGeometry(0.062, 8, 6);
    lHandGeo.scale(1.0, 0.85, 0.82);
    lHandGeo.translate(0, -0.39, 0.02);
    const lHand = new THREE.Mesh(lHandGeo, m.skin);
    this.leftForearmGroup.add(lHand);
    this.leftArmGroup.add(this.leftForearmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.33, 0.46, 0);
    const rDeltoid = new THREE.Mesh(deltoidGeo, m.skin);
    this.rightArmGroup.add(rDeltoid);
    const rUpperArm = new THREE.Mesh(upperArmGeo, m.skin);
    rUpperArm.castShadow = true;
    this.rightArmGroup.add(rUpperArm);
    const rBicep = new THREE.Mesh(bicepBulgeGeo, m.skin);
    rBicep.position.set(-0.02, -0.14, 0.06);
    this.rightArmGroup.add(rBicep);
    const rBand = new THREE.Mesh(bicepBandGeo, m.leatherWrap);
    rBand.position.set(0, -0.12, 0);
    this.rightArmGroup.add(rBand);
    this.torsoGroup.add(this.rightArmGroup);

    // Right Forearm
    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.32, 0);
    const rForearm = new THREE.Mesh(lForearmGeo, m.skin);
    rForearm.castShadow = true;
    this.rightForearmGroup.add(rForearm);
    for (let w = 0; w < 3; w++) {
      const wrapGeo2 = new THREE.CylinderGeometry(0.077 - w * 0.002, 0.077 - w * 0.002, 0.045, 9);
      const wrapRing2 = new THREE.Mesh(wrapGeo2, m.leatherWrap);
      wrapRing2.position.set(0, -0.27 - w * 0.045, 0);
      this.rightForearmGroup.add(wrapRing2);
    }
    const rHand = new THREE.Mesh(lHandGeo, m.skin);
    this.rightForearmGroup.add(rHand);
    this.rightArmGroup.add(this.rightForearmGroup);

    // ── Waistband & Torn Cargo Pants ─────────────────────────
    const waistGeo = new THREE.CylinderGeometry(0.225, 0.235, 0.14, 12);
    const waistBand = new THREE.Mesh(waistGeo, m.leatherWrap);
    waistBand.position.set(0, 0.04, 0);
    this.spineGroup.add(waistBand);

    // Cargo pant legs — torn at the knee-ish
    const thighGeo = new THREE.CapsuleGeometry(0.115, 0.36, 8, 10);
    thighGeo.translate(0, -0.2, 0);
    const calfGeo = new THREE.CapsuleGeometry(0.09, 0.28, 8, 10);
    calfGeo.translate(0, -0.16, 0);

    // Ankle cord
    const ankleGeo = new THREE.CylinderGeometry(0.093, 0.09, 0.07, 9);

    const footGeo = new THREE.SphereGeometry(0.07, 8, 6);
    footGeo.scale(1.15, 0.55, 1.65);
    footGeo.translate(0, -0.285, 0.06);

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.155, 0, 0);
    const lThighMesh = new THREE.Mesh(thighGeo, m.pants);
    lThighMesh.castShadow = true;
    this.leftLegGroup.add(lThighMesh);

    this.leftKneeGroup = new THREE.Group();
    this.leftKneeGroup.position.set(0, -0.43, 0);
    const lCalf = new THREE.Mesh(calfGeo, m.skin); // bare below torn pants
    lCalf.castShadow = true;
    this.leftKneeGroup.add(lCalf);
    const lAnkle = new THREE.Mesh(ankleGeo, m.leatherWrap);
    lAnkle.position.set(0, -0.31, 0);
    this.leftKneeGroup.add(lAnkle);
    const lFoot = new THREE.Mesh(footGeo, m.skin);
    lFoot.castShadow = true;
    this.leftKneeGroup.add(lFoot);
    this.leftLegGroup.add(this.leftKneeGroup);
    this.spineGroup.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.155, 0, 0);
    const rThighMesh = new THREE.Mesh(thighGeo, m.pants);
    rThighMesh.castShadow = true;
    this.rightLegGroup.add(rThighMesh);

    this.rightKneeGroup = new THREE.Group();
    this.rightKneeGroup.position.set(0, -0.43, 0);
    const rCalf = new THREE.Mesh(calfGeo, m.skin);
    rCalf.castShadow = true;
    this.rightKneeGroup.add(rCalf);
    const rAnkle = new THREE.Mesh(ankleGeo, m.leatherWrap);
    rAnkle.position.set(0, -0.31, 0);
    this.rightKneeGroup.add(rAnkle);
    const rFoot = new THREE.Mesh(footGeo, m.skin);
    rFoot.castShadow = true;
    this.rightKneeGroup.add(rFoot);
    this.rightLegGroup.add(this.rightKneeGroup);
    this.spineGroup.add(this.rightLegGroup);

    this.reset();
  }

  /** Initialize PBR materials with physical skin sheen for realism. */
  private static initSharedMaterials(): void {
    if (Player.sharedMaterials) return;

    Player.sharedMaterials = {
      // Tanned, sun-bronzed athletic skin — MeshPhysicalMaterial with sheen
      skin: new THREE.MeshPhysicalMaterial({
        color: 0xc8784a,
        roughness: 0.52,
        metalness: 0.0,
        sheen: 0.22,
        sheenRoughness: 0.65,
        sheenColor: new THREE.Color(0xd4906a),
      }),

      // Slightly darker skin for shadows / brow depth
      darkSkin: new THREE.MeshPhysicalMaterial({
        color: 0xa86038,
        roughness: 0.6,
        metalness: 0.0,
        sheen: 0.1,
        sheenRoughness: 0.7,
        sheenColor: new THREE.Color(0xb87050),
      }),

      // Wild dark brown hair — medium gloss
      hair: new THREE.MeshStandardMaterial({
        color: 0x1a0e08,
        roughness: 0.72,
        metalness: 0.06,
      }),

      // Torn earth-toned cargo pants (khaki/olive)
      pants: new THREE.MeshStandardMaterial({
        color: 0x5a4f32,
        roughness: 0.88,
        metalness: 0.0,
      }),

      // Rugged open chest vest — faded olive/tan linen
      vest: new THREE.MeshStandardMaterial({
        color: 0x7a6940,
        roughness: 0.9,
        metalness: 0.0,
      }),

      // Weathered leather straps, wrist & ankle wraps
      leatherWrap: new THREE.MeshStandardMaterial({
        color: 0x3a2310,
        roughness: 0.88,
        metalness: 0.04,
      }),

      // Eye whites
      eyeWhite: new THREE.MeshStandardMaterial({
        color: 0xf0ece4,
        roughness: 0.25,
        metalness: 0.0,
      }),

      // Dark eye pupils
      eyePupil: new THREE.MeshStandardMaterial({
        color: 0x100a06,
        roughness: 0.3,
        metalness: 0.02,
      }),

      // Teeth (slight tint)
      tooth: new THREE.MeshStandardMaterial({
        color: 0xddd8c4,
        roughness: 0.3,
        metalness: 0.0,
      }),
    };
  }

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
    this.spineGroup.position.set(0, 0.98, 0);
    this.spineGroup.rotation.set(0, 0, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    this.hairGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.leftForearmGroup.rotation.set(0, 0, 0);
    this.rightForearmGroup.rotation.set(0, 0, 0);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.leftKneeGroup.rotation.set(0, 0, 0);
    this.rightKneeGroup.rotation.set(0, 0, 0);
    this.vestFlapL.rotation.z = 0.12;
    this.vestFlapR.rotation.z = -0.12;
  }

  public handleLeft(): void {
    if (!this.isAlive) return;
    if (this.targetLane === LANE.LEFT) {
      this.isAlive = false;
      this.callbacks.onGameOver('Fell off the left side of the track!');
      return;
    }
    this.targetLane = (this.targetLane - 1) as Lane;
    this.callbacks.onLaneSwitch?.();
  }

  public handleRight(): void {
    if (!this.isAlive) return;
    if (this.targetLane === LANE.RIGHT) {
      this.isAlive = false;
      this.callbacks.onGameOver('Fell off the right side of the track!');
      return;
    }
    this.targetLane = (this.targetLane + 1) as Lane;
    this.callbacks.onLaneSwitch?.();
  }

  public handleJump(): void {
    if (!this.isAlive) return;
    this.action = 'JUMPING';
    this.actionTimer = 0;
    this.actionDuration = CONFIG.PLAYER.JUMP_DURATION;
    this.callbacks.onJump?.();
  }

  public handleSlide(): void {
    if (!this.isAlive) return;
    this.action = 'SLIDING';
    this.actionTimer = 0;
    this.actionDuration = CONFIG.PLAYER.SLIDE_DURATION;
    this.y = 0;
    this.callbacks.onSlide?.();
  }

  public update(dt: number, currentSpeed: number): void {
    const safeDt = dt;

    if (!this.isAlive) {
      // Dramatic tumble-collapse on death
      this.rootGroup.rotation.x = THREE.MathUtils.lerp(this.rootGroup.rotation.x, -Math.PI / 2.1, 8 * safeDt);
      this.rootGroup.position.y = THREE.MathUtils.lerp(this.rootGroup.position.y, 0.18, 8 * safeDt);
      return;
    }

    // 1. Smooth lane transition
    const targetX = getLaneX(this.targetLane);
    const switchSpeed = 1.0 / CONFIG.LANE_SWITCH_DURATION;
    this.x = THREE.MathUtils.damp(this.x, targetX, switchSpeed * 3, safeDt);

    if (Math.abs(this.x - targetX) < 0.15) {
      this.lane = this.targetLane;
    }

    // Athletic lean when switching lanes
    const xDiff = targetX - this.x;
    this.rootGroup.rotation.z = -xDiff * 0.2;
    this.torsoGroup.rotation.y = xDiff * 0.16;

    // 2. Vertical action (jump / slide)
    if (this.action === 'JUMPING') {
      this.actionTimer += safeDt;
      const progress = this.actionTimer / this.actionDuration;
      if (progress >= 1.0) {
        this.action = 'NONE';
        this.y = 0;
        this.actionTimer = 0;
      } else {
        this.y = CONFIG.PLAYER.JUMP_HEIGHT * Math.sin(Math.PI * progress);
      }
    } else if (this.action === 'SLIDING') {
      this.actionTimer += safeDt;
      const progress = this.actionTimer / this.actionDuration;
      if (progress >= 1.0) {
        this.action = 'NONE';
        this.y = 0;
        this.actionTimer = 0;
      } else {
        this.y = 0;
      }
    } else {
      this.y = 0;
    }

    // 3. Apply world position
    this.mesh.position.set(this.x, this.y, this.z);

    // 4. Procedural animation
    if (this.action === 'JUMPING') {
      this._poseJump();
    } else if (this.action === 'SLIDING') {
      this._poseSlide();
    } else {
      this._poseRun(safeDt, currentSpeed);
    }
  }

  /** Airborne jump pose — tuck and reach. */
  private _poseJump(): void {
    this.spineGroup.position.y = 0.98;
    this.torsoGroup.rotation.x = 0.22;
    this.headGroup.rotation.x = -0.18;
    this.hairGroup.rotation.x = 0.38; // hair streams back

    // Tuck knees up in mid-air
    this.leftLegGroup.rotation.x = -1.05;
    this.leftKneeGroup.rotation.x = 1.35;
    this.rightLegGroup.rotation.x = -0.8;
    this.rightKneeGroup.rotation.x = 1.45;

    // Arms reach forward for balance
    this.leftArmGroup.rotation.x = 0.95;
    this.leftForearmGroup.rotation.x = -0.3;
    this.rightArmGroup.rotation.x = 1.05;
    this.rightForearmGroup.rotation.x = -0.3;

    // Vest flaps fly back
    this.vestFlapL.rotation.z = -0.08;
    this.vestFlapR.rotation.z = 0.08;
    this.rootGroup.position.y = 0;
  }

  /** Ground slide pose — aggressive low crouch. */
  private _poseSlide(): void {
    this.spineGroup.position.y = 0.35;
    this.torsoGroup.rotation.x = -1.0;
    this.headGroup.rotation.x = 0.62;
    this.hairGroup.rotation.x = -0.35;

    this.leftLegGroup.rotation.x = 1.45;
    this.leftKneeGroup.rotation.x = 0.12;
    this.rightLegGroup.rotation.x = 1.55;
    this.rightKneeGroup.rotation.x = 0.18;

    this.leftArmGroup.rotation.x = -0.65;
    this.leftForearmGroup.rotation.x = 0.2;
    this.rightArmGroup.rotation.x = -0.65;
    this.rightForearmGroup.rotation.x = 0.2;

    this.vestFlapL.rotation.z = 0.35;
    this.vestFlapR.rotation.z = -0.35;
    this.rootGroup.position.y = -0.15;
  }

  /** Full running stride — powerful, athletic sprint. */
  private _poseRun(dt: number, currentSpeed: number): void {
    this.runAnimTime += dt * (currentSpeed / CONFIG.SPEED.INITIAL) * CONFIG.PLAYER.RUN_CYCLE_SPEED;

    const legSwing = Math.sin(this.runAnimTime) * 0.88;
    const armSwing = -legSwing * 1.05;
    const bounce = Math.abs(Math.sin(this.runAnimTime * 2)) * 0.09;

    // Vertical body bob + forward lean (predator sprint)
    this.spineGroup.position.y = 0.98 + bounce;
    this.torsoGroup.rotation.x = 0.2;

    // Hair sways naturally with stride
    this.hairGroup.rotation.z = Math.sin(this.runAnimTime) * 0.12;
    this.hairGroup.rotation.x = 0.12 + bounce;

    // Vest flaps flutter with movement
    this.vestFlapL.rotation.z = 0.12 + Math.sin(this.runAnimTime * 2) * 0.1;
    this.vestFlapR.rotation.z = -0.12 - Math.sin(this.runAnimTime * 2) * 0.1;

    // Leg swing with knee drive
    this.leftLegGroup.rotation.x = legSwing;
    this.leftKneeGroup.rotation.x = legSwing < 0 ? -legSwing * 1.35 : 0.16;
    this.rightLegGroup.rotation.x = -legSwing;
    this.rightKneeGroup.rotation.x = legSwing > 0 ? legSwing * 1.35 : 0.16;

    // Arm pump — upper arm + forearm counter-rotation for natural elbow bend
    this.leftArmGroup.rotation.x = armSwing * 0.85;
    this.leftForearmGroup.rotation.x = Math.max(0, armSwing) * 0.7 + 0.25;
    this.rightArmGroup.rotation.x = -armSwing * 0.85;
    this.rightForearmGroup.rotation.x = Math.max(0, -armSwing) * 0.7 + 0.25;

    this.rootGroup.position.y = 0;
  }

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

  public kill(reason: string): void {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.callbacks.onGameOver(reason);
  }
}
