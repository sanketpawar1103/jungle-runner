import * as THREE from 'three';
import { CONFIG } from '../config';
import { VisualZone } from '../types';
import { textureManager } from '../utils/procedural-textures';

export class TrackSection {
  public mesh: THREE.Group;
  public z: number = 0;
  public zone: VisualZone = 'LUSH_JUNGLE';

  // Zone decoration groups
  private jungleDecorGroup: THREE.Group;
  private ruinsDecorGroup: THREE.Group;
  private stoneDecorGroup: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'CinematicTrackSection';

    const sectionLength = CONFIG.WORLD.SECTION_LENGTH;
    const trackWidth = CONFIG.WORLD.TRACK_WIDTH;

    // 1. Ancient Flagstone Road (Realistic PBR stone with moss in crevices)
    const stoneTex = textureManager.getAncientStoneTexture();
    const trackGeo = new THREE.PlaneGeometry(trackWidth, sectionLength);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.1,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    this.mesh.add(trackMesh);

    // 2. Subtle Aged Lane Inset Grooves (natural stone cuts separating the 3 lanes)
    const grooveMat = new THREE.MeshStandardMaterial({
      color: 0x1f1d19,
      roughness: 0.95,
    });
    const lineX1 = -CONFIG.LANE_WIDTH / 2;
    const lineX2 = CONFIG.LANE_WIDTH / 2;

    const grooveGeo = new THREE.PlaneGeometry(0.14, sectionLength);
    grooveGeo.rotateX(-Math.PI / 2);

    const divider1 = new THREE.Mesh(grooveGeo, grooveMat);
    divider1.position.set(lineX1, 0.015, 0);
    divider1.receiveShadow = true;
    this.mesh.add(divider1);

    const divider2 = new THREE.Mesh(grooveGeo, grooveMat);
    divider2.position.set(lineX2, 0.015, 0);
    divider2.receiveShadow = true;
    this.mesh.add(divider2);

    // 3. Ancient Moss-Covered Stone Curbs
    const curbGeo = new THREE.BoxGeometry(0.45, 0.35, sectionLength);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x424039,
      roughness: 0.9,
    });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-trackWidth / 2 + 0.22, 0.15, 0);
    leftCurb.castShadow = true;
    leftCurb.receiveShadow = true;
    this.mesh.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(trackWidth / 2 - 0.22, 0.15, 0);
    rightCurb.castShadow = true;
    rightCurb.receiveShadow = true;
    this.mesh.add(rightCurb);

    // 4. Natural Jungle Forest Floor Soil with Scattered Foliage
    const groundTex = textureManager.getJungleGroundTexture();
    const groundGeo = new THREE.PlaneGeometry(32, sectionLength);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.95,
      metalness: 0.05,
    });

    const leftGround = new THREE.Mesh(groundGeo, groundMat);
    leftGround.position.set(-trackWidth / 2 - 16, -0.05, 0);
    leftGround.receiveShadow = true;
    this.mesh.add(leftGround);

    const rightGround = new THREE.Mesh(groundGeo, groundMat);
    rightGround.position.set(trackWidth / 2 + 16, -0.05, 0);
    rightGround.receiveShadow = true;
    this.mesh.add(rightGround);

    // 5. Zone Scenery Groups
    this.jungleDecorGroup = this.createRealisticJungleDecor(sectionLength, trackWidth);
    this.ruinsDecorGroup = this.createAncientTempleRuinsDecor(sectionLength, trackWidth);
    this.stoneDecorGroup = this.createMossyPassageDecor(sectionLength, trackWidth);

    this.mesh.add(this.jungleDecorGroup);
    this.mesh.add(this.ruinsDecorGroup);
    this.mesh.add(this.stoneDecorGroup);

    this.setZone('LUSH_JUNGLE');
  }

  /**
   * Zone 1: Lush Rainforest with massive canopy trees, fluted roots, and tropical undergrowth.
   */
  private createRealisticJungleDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const barkTex = textureManager.getTreeBarkTexture();

    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.9,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x225518,
      roughness: 0.75,
      flatShading: true,
    });
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x3d7e22,
      roughness: 0.65,
    });

    const trunkGeo = new THREE.CylinderGeometry(0.55, 0.95, 8.5, 9);
    const rootGeo = new THREE.ConeGeometry(0.4, 1.8, 6);
    rootGeo.rotateZ(Math.PI / 4);

    const canopyGeo = new THREE.DodecahedronGeometry(3.2, 1);
    const fernLeafGeo = new THREE.ConeGeometry(0.7, 2.2, 4);

    for (let i = -length / 2 + 4; i < length / 2; i += 8) {
      // Left Rainforest Tree with Buttress Roots
      const leftTree = new THREE.Group();
      const trunk1 = new THREE.Mesh(trunkGeo, barkMat);
      trunk1.position.y = 4.25;
      trunk1.castShadow = true;
      leftTree.add(trunk1);

      // Fluted buttress roots
      const r1 = new THREE.Mesh(rootGeo, barkMat);
      r1.position.set(0.6, 0.4, 0.5);
      leftTree.add(r1);

      // Multi-cluster canopy
      const c1 = new THREE.Mesh(canopyGeo, canopyMat);
      c1.position.set(0, 8.5, 0);
      c1.castShadow = true;
      leftTree.add(c1);

      const c2 = new THREE.Mesh(canopyGeo, canopyMat);
      c2.position.set(0.8, 7.8, -0.6);
      c2.scale.set(0.7, 0.7, 0.7);
      leftTree.add(c2);

      leftTree.position.set(-trackWidth / 2 - 3.2 - Math.random() * 2, 0, i);
      group.add(leftTree);

      // Right Rainforest Tree
      const rightTree = new THREE.Group();
      const trunk2 = new THREE.Mesh(trunkGeo, barkMat);
      trunk2.position.y = 4.25;
      trunk2.castShadow = true;
      rightTree.add(trunk2);

      const c3 = new THREE.Mesh(canopyGeo, canopyMat);
      c3.position.set(0, 8.5, 0);
      c3.castShadow = true;
      rightTree.add(c3);

      rightTree.position.set(trackWidth / 2 + 3.2 + Math.random() * 2, 0, i + 3.5);
      group.add(rightTree);

      // Giant Jungle Ferns along track edge
      const fern = new THREE.Group();
      for (let f = 0; f < 5; f++) {
        const leaf = new THREE.Mesh(fernLeafGeo, fernMat);
        leaf.rotation.z = 0.6 * Math.cos((f * Math.PI * 2) / 5);
        leaf.rotation.x = 0.6 * Math.sin((f * Math.PI * 2) / 5);
        leaf.position.y = 0.6;
        fern.add(leaf);
      }
      fern.position.set(-trackWidth / 2 - 1.2, 0, i + 2);
      group.add(fern);

      // Overhead Jungle Canopy Arches with Dappled Leaves & Hanging Lianas
      if (Math.abs(i) < 4) {
        const archBranchGeo = new THREE.CylinderGeometry(0.22, 0.32, trackWidth + 8, 8);
        archBranchGeo.rotateZ(Math.PI / 2);
        const archBranch = new THREE.Mesh(archBranchGeo, barkMat);
        archBranch.position.set(0, 8.6, i);
        archBranch.castShadow = true;
        group.add(archBranch);

        const archLeaves = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), canopyMat);
        archLeaves.position.set(0, 9.5, i);
        archLeaves.castShadow = true;
        group.add(archLeaves);

        // Hanging jungle vines
        const lianaGeo = new THREE.CylinderGeometry(0.025, 0.035, 3.2, 4);
        for (let v = -2.2; v <= 2.2; v += 2.2) {
          const liana = new THREE.Mesh(lianaGeo, fernMat);
          liana.position.set(v, 6.8, i);
          group.add(liana);
        }
      }
    }

    return group;
  }

  /**
   * Zone 2: Ancient Temple Ruins (closely matching the provided reference image!)
   * Features multi-tiered stone step pyramids, moss-covered brick walls, and carved stone ruins.
   */
  private createAncientTempleRuinsDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const stoneTex = textureManager.getAncientStoneTexture();

    const templeStoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
    });
    const mossCoverMat = new THREE.MeshStandardMaterial({
      color: 0x3b5f25,
      roughness: 0.9,
    });

    // Multi-tiered stone steps and temple structures on sides
    for (let i = -length / 2 + 5; i < length / 2; i += 10) {
      // Left Multi-Tiered Temple Ruins
      const leftRuin = new THREE.Group();

      // Tier 1 Base
      const tier1Geo = new THREE.BoxGeometry(4.2, 1.2, 7.5);
      const tier1 = new THREE.Mesh(tier1Geo, templeStoneMat);
      tier1.position.set(0, 0.6, 0);
      tier1.castShadow = true;
      tier1.receiveShadow = true;
      leftRuin.add(tier1);

      // Moss cap on Tier 1
      const moss1 = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.15, 7.6), mossCoverMat);
      moss1.position.set(0, 1.25, 0);
      leftRuin.add(moss1);

      // Tier 2
      const tier2Geo = new THREE.BoxGeometry(3.0, 1.4, 5.5);
      const tier2 = new THREE.Mesh(tier2Geo, templeStoneMat);
      tier2.position.set(-0.4, 1.9, 0);
      tier2.castShadow = true;
      tier2.receiveShadow = true;
      leftRuin.add(tier2);

      // Ancient temple sanctuary columns on top
      const colGeo = new THREE.CylinderGeometry(0.35, 0.4, 2.4, 8);
      for (let c = -1; c <= 1; c += 2) {
        const col = new THREE.Mesh(colGeo, templeStoneMat);
        col.position.set(-0.4, 3.8, c * 1.5);
        col.castShadow = true;
        leftRuin.add(col);
      }

      // Temple lintel roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 4.2), templeStoneMat);
      roof.position.set(-0.4, 5.2, 0);
      roof.castShadow = true;
      leftRuin.add(roof);

      // Overgrown steps cascading toward the track (as in reference image)
      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 3.2), templeStoneMat);
        step.position.set(1.6 - s * 0.4, 0.18 + s * 0.35, 0);
        step.receiveShadow = true;
        leftRuin.add(step);
      }

      leftRuin.position.set(-trackWidth / 2 - 3.2, 0, i);
      group.add(leftRuin);

      // Right Ancient Stone Wall Ruins
      const rightRuin = new THREE.Group();
      const wallGeo = new THREE.BoxGeometry(3.2, 3.2, 6.5);
      const wall = new THREE.Mesh(wallGeo, templeStoneMat);
      wall.position.set(0, 1.6, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      rightRuin.add(wall);

      // Broken columns
      const rCol = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 3.8, 8), templeStoneMat);
      rCol.position.set(-1.2, 1.9, 1.5);
      rCol.castShadow = true;
      rightRuin.add(rCol);

      rightRuin.position.set(trackWidth / 2 + 3.2, 0, i);
      group.add(rightRuin);

      // Ancient Overhanging Temple Arch connecting left and right ruins over the path (Screenshot 2)
      if (Math.abs(i) < 2) {
        const templeArch = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 6.4, 0.9, 1.4), templeStoneMat);
        templeArch.position.set(0, 7.8, i);
        templeArch.castShadow = true;
        group.add(templeArch);

        const archMoss = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 6.6, 0.2, 1.6), mossCoverMat);
        archMoss.position.set(0, 8.3, i);
        group.add(archMoss);
      }
    }

    return group;
  }

  /**
   * Zone 3: Mossy Stone Passages with burning torches and towering mossy masonry.
   */
  private createMossyPassageDecor(length: number, trackWidth: number): THREE.Group {
    const group = new THREE.Group();
    const stoneTex = textureManager.getAncientStoneTexture();

    const wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9,
    });
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x27431e,
      roughness: 0.95,
    });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
    });

    // Massive overgrown stone canyon walls
    const wallGeo = new THREE.BoxGeometry(2.4, 7.5, length);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-trackWidth / 2 - 1.2, 3.75, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(trackWidth / 2 + 1.2, 3.75, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Stone Archway & Torches
    for (let i = -length / 2 + 5; i < length / 2; i += 9) {
      // Torches on walls
      const torchL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), wallMat);
      torchL.position.set(-trackWidth / 2 + 0.1, 2.6, i);
      group.add(torchL);

      const flameL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), flameMat);
      flameL.position.set(-trackWidth / 2 + 0.1, 2.9, i);
      group.add(flameL);

      const torchR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), wallMat);
      torchR.position.set(trackWidth / 2 - 0.1, 2.6, i);
      group.add(torchR);

      const flameR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), flameMat);
      flameR.position.set(trackWidth / 2 - 0.1, 2.9, i);
      group.add(flameR);

      // Moss crest on walls
      const mossPatch = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 4.0), mossMat);
      mossPatch.position.set(-trackWidth / 2 + 0.05, 2.0, i - 1.5);
      group.add(mossPatch);
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
      const z = (1 - i) * len;
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

  public update(deltaMove: number, currentZone: VisualZone): void {
    const len = CONFIG.WORLD.SECTION_LENGTH;
    const despawnZ = CONFIG.WORLD.DESPAWN_Z + len;

    for (const section of this.sections) {
      section.setPositionZ(section.z + deltaMove);
    }

    for (const section of this.sections) {
      if (section.z > despawnZ) {
        let minZ = Infinity;
        for (const s of this.sections) {
          if (s.z < minZ) minZ = s.z;
        }
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
