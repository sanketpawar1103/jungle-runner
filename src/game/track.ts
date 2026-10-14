import * as THREE from 'three';
import { CONFIG } from '../config';
import { VisualZone } from '../types';

export class TrackSection {
  public mesh: THREE.Group;
  public z: number = 0;
  public zone: VisualZone = 'LUSH_JUNGLE';

  // Specific zone decoration groups
  private jungleDecorGroup: THREE.Group;
  private ruinsDecorGroup: THREE.Group;
  private stoneDecorGroup: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'TrackSection';

    const sectionLength = CONFIG.WORLD.SECTION_LENGTH;
    const trackWidth = CONFIG.WORLD.TRACK_WIDTH;

    // 1. Main 3-Lane Track Surface (Stone Path)
    const trackGeo = new THREE.PlaneGeometry(trackWidth, sectionLength);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x3d352a });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    this.mesh.add(trackMesh);

    // 2. Lane Dividers (two subtle dashed or textured lines separating the 3 lanes)
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0x6e6353 });
    const lineX1 = -CONFIG.LANE_WIDTH / 2;
    const lineX2 = CONFIG.LANE_WIDTH / 2;

    const lineGeo = new THREE.PlaneGeometry(0.12, sectionLength);
    lineGeo.rotateX(-Math.PI / 2);

    const divider1 = new THREE.Mesh(lineGeo, dividerMat);
    divider1.position.set(lineX1, 0.01, 0);
    this.mesh.add(divider1);

    const divider2 = new THREE.Mesh(lineGeo, dividerMat);
    divider2.position.set(lineX2, 0.01, 0);
    this.mesh.add(divider2);

    // 3. Side Curbs
    const curbGeo = new THREE.BoxGeometry(0.4, 0.25, sectionLength);
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x225528 });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-trackWidth / 2 + 0.2, 0.1, 0);
    this.mesh.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(trackWidth / 2 - 0.2, 0.1, 0);
    this.mesh.add(rightCurb);

    // 4. Side Terrain Banks (ground extending to the sides)
    const groundGeo = new THREE.PlaneGeometry(24, sectionLength);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1f381c });

    const leftGround = new THREE.Mesh(groundGeo, groundMat);
    leftGround.position.set(-trackWidth / 2 - 12, -0.05, 0);
    this.mesh.add(leftGround);

    const rightGround = new THREE.Mesh(groundGeo, groundMat);
    rightGround.position.set(trackWidth / 2 + 12, -0.05, 0);
    this.mesh.add(rightGround);

    // 5. Zone-specific Scenery Groups
    this.jungleDecorGroup = this.createJungleDecor(sectionLength, trackWidth);
    this.ruinsDecorGroup = this.createRuinsDecor(sectionLength, trackWidth);
    this.stoneDecorGroup = this.createStonePassageDecor(sectionLength, trackWidth);

    this.mesh.add(this.jungleDecorGroup);
    this.mesh.add(this.ruinsDecorGroup);
    this.mesh.add(this.stoneDecorGroup);

    this.setZone('LUSH_JUNGLE');
  }

  private createJungleDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const bushMat = new THREE.MeshLambertMaterial({ color: 0x1e6f1d });

    const treeTrunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 6.0, 7);
    const canopyGeo = new THREE.ConeGeometry(2.4, 4.5, 7);
    const bushGeo = new THREE.DodecahedronGeometry(1.2, 1);

    // Place trees and bushes along left and right sides
    for (let i = -length / 2 + 3; i < length / 2; i += 7) {
      // Left side tree
      const leftTree = new THREE.Group();
      const trunk1 = new THREE.Mesh(treeTrunkGeo, treeMat);
      trunk1.position.y = 3;
      const canopy1 = new THREE.Mesh(canopyGeo, leafMat);
      canopy1.position.y = 6.2;
      leftTree.add(trunk1);
      leftTree.add(canopy1);
      leftTree.position.set(-trackWidth / 2 - 2.8 - Math.random() * 2, 0, i);
      group.add(leftTree);

      // Right side tree
      const rightTree = new THREE.Group();
      const trunk2 = new THREE.Mesh(treeTrunkGeo, treeMat);
      trunk2.position.y = 3;
      const canopy2 = new THREE.Mesh(canopyGeo, leafMat);
      canopy2.position.y = 6.2;
      rightTree.add(trunk2);
      rightTree.add(canopy2);
      rightTree.position.set(trackWidth / 2 + 2.8 + Math.random() * 2, 0, i + 3.5);
      group.add(rightTree);

      // Bushes
      const bush1 = new THREE.Mesh(bushGeo, bushMat);
      bush1.position.set(-trackWidth / 2 - 1.2, 0.5, i + 2);
      group.add(bush1);

      const bush2 = new THREE.Mesh(bushGeo, bushMat);
      bush2.position.set(trackWidth / 2 + 1.2, 0.5, i - 1.5);
      group.add(bush2);
    }

    return group;
  }

  private createRuinsDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a7d6e });
    const darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5043 });

    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.65, 5.5, 8);
    const capitalGeo = new THREE.BoxGeometry(1.4, 0.45, 1.4);

    // Stone pillars and broken archways on edges
    for (let i = -length / 2 + 4; i < length / 2; i += 9) {
      // Left Pillar
      const leftPillar = new THREE.Group();
      const p1 = new THREE.Mesh(pillarGeo, stoneMat);
      p1.position.y = 2.75;
      const c1 = new THREE.Mesh(capitalGeo, darkStoneMat);
      c1.position.y = 5.6;
      leftPillar.add(p1);
      leftPillar.add(c1);
      leftPillar.position.set(-trackWidth / 2 - 1.6, 0, i);
      group.add(leftPillar);

      // Right Pillar
      const rightPillar = new THREE.Group();
      const p2 = new THREE.Mesh(pillarGeo, stoneMat);
      p2.position.y = 2.75;
      const c2 = new THREE.Mesh(capitalGeo, darkStoneMat);
      c2.position.y = 5.6;
      rightPillar.add(p2);
      rightPillar.add(c2);
      rightPillar.position.set(trackWidth / 2 + 1.6, 0, i);
      group.add(rightPillar);

      // Arch beam connecting pillars over the track periodically
      if (Math.abs(i) < 2) {
        const archBeamGeo = new THREE.BoxGeometry(trackWidth + 3.8, 0.7, 1.0);
        const archBeam = new THREE.Mesh(archBeamGeo, stoneMat);
        archBeam.position.set(0, 6.0, i);
        group.add(archBeam);
      }
    }

    return group;
  }

  private createStonePassageDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x323a40 });
    const mossMat = new THREE.MeshLambertMaterial({ color: 0x274330 });
    const torchMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 }); // glowing torch/lantern

    // Massive stone side walls flanking track
    const wallGeo = new THREE.BoxGeometry(1.8, 6.5, length);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-trackWidth / 2 - 0.9, 3.25, 0);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(trackWidth / 2 + 0.9, 3.25, 0);
    group.add(rightWall);

    // Torches and moss layers on walls
    for (let i = -length / 2 + 5; i < length / 2; i += 8) {
      const torchGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
      const torchMeshL = new THREE.Mesh(torchGeo, torchMat);
      torchMeshL.position.set(-trackWidth / 2 + 0.1, 2.5, i);
      group.add(torchMeshL);

      const torchMeshR = new THREE.Mesh(torchGeo, torchMat);
      torchMeshR.position.set(trackWidth / 2 - 0.1, 2.5, i);
      group.add(torchMeshR);

      // Moss patch on wall
      const mossGeo = new THREE.BoxGeometry(0.1, 2.2, 3.5);
      const mossL = new THREE.Mesh(mossGeo, mossMat);
      mossL.position.set(-trackWidth / 2 + 0.05, 1.5, i - 2);
      group.add(mossL);
    }

    return group;
  }

  public setPositionZ(z: number): void {
    this.z = z;
    this.mesh.position.z = z;
  }

  public setZone(zone: VisualZone): void {
    this.zone = zone;
    this.jungleDecorGroup.visible = zone === 'LUSH_JUNGLE';
    this.ruinsDecorGroup.visible = zone === 'TEMPLE_RUINS';
    this.stoneDecorGroup.visible = zone === 'STONE_PASSAGES';
  }

  public dispose(): void {
    this.mesh.traverse((child) => {
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
}

/**
 * Manages the infinite moving track sections.
 */
export class TrackManager {
  private sections: TrackSection[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const count = CONFIG.WORLD.VISIBLE_SECTIONS;
    const len = CONFIG.WORLD.SECTION_LENGTH;

    for (let i = 0; i < count; i++) {
      const section = new TrackSection();
      // Initially, player starts at z = 0.
      // Sections extend from in front of player (z < 0) to behind player (z > 0)
      const z = (1 - i) * len; // e.g., +30, 0, -30, -60, -90, -120
      section.setPositionZ(z);
      this.sections.push(section);
      this.scene.add(section.mesh);
    }
  }

  public reset(initialZone: VisualZone = 'LUSH_JUNGLE'): void {
    const len = CONFIG.WORLD.SECTION_LENGTH;
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const z = (1 - i) * len;
      section.setPositionZ(z);
      section.setZone(initialZone);
    }
  }

  /**
   * Advances the track forward toward the player (in +Z direction) by deltaMove.
   * Recycles sections that pass behind the player camera.
   */
  public update(deltaMove: number, currentZone: VisualZone): void {
    const len = CONFIG.WORLD.SECTION_LENGTH;
    const despawnZ = CONFIG.WORLD.DESPAWN_Z + len;

    for (const section of this.sections) {
      section.setPositionZ(section.z + deltaMove);
    }

    // Check if the closest section passed behind the camera
    for (const section of this.sections) {
      if (section.z > despawnZ) {
        // Find furthest section in front (smallest Z)
        let minZ = Infinity;
        for (const s of this.sections) {
          if (s.z < minZ) minZ = s.z;
        }

        // Recycle to the front
        section.setPositionZ(minZ - len);
        section.setZone(currentZone);
      }
    }
  }

  public dispose(): void {
    for (const section of this.sections) {
      this.scene.remove(section.mesh);
      section.dispose();
    }
    this.sections = [];
  }
}
