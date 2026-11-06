import * as THREE from 'three';

/**
 * Artefak & Momen Kisah Raka & Risya
 * Disesuaikan dari naskah cerpen
 */
export const SHARD_MEMORIES = [
  {
    id: 'shard-0',
    title: 'Kacamata Berbingkai Tipis',
    timestamp: 'LANTAI SATU KAMPUS',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // KACAMATA-RISYA',
    text: 'Kacamata berbingkai tipis yang sesekali melorot di hidung Risya saat gadis itu menunduk serius, lalu jari telunjuknya akan terangkat otomatis mendorongnya kembali ke atas. Tatapannya di balik pantulan lensa itu selalu terasa menenangkan.'
  },
  {
    id: 'shard-1',
    title: 'Daun Pintu Kayu Perpustakaan',
    timestamp: 'LANTAI DUA KAMPUS',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // PINTU-PERPUS',
    text: 'Pintu kayu kokoh yang agak berat menuju ruang perpustakaan ber-AC. Raka melangkah lebih dulu untuk mendorongnya, menahan bukaannya sejenak agar Risya bisa melangkah masuk lebih dulu ke dalam keheningan yang sejuk.'
  },
  {
    id: 'shard-2',
    title: 'Jaring Poligon 3D & Tabel Angka',
    timestamp: 'MEJA PANJANG PERPUSTAKAAN',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // BLENDER-LAPTOP',
    text: 'Layar laptop Raka yang menampilkan ruang kerja Blender berlatar abu-abu gelap dengan jaring poligon rumit, bersanding dengan layar laptop Risya yang penuh dengan deretan slide presentasi dan tabel data.'
  },
  {
    id: 'shard-3',
    title: 'Sentuhan Ujung Lengan Kemeja',
    timestamp: 'SELA-SELA MENGETIK',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // GESEKAN-LENGAN',
    text: 'Siku dan ujung lengan kemeja Raka yang sesekali bersentuhan tanpa sengaja dengan lengan Risya saat menggerakkan tetikus. Setiap kali Risya mencondongkan tubuh berbisik menanyakan warna bagan, detak jantung Raka berdegup lebih cepat.'
  },
  {
    id: 'shard-4',
    title: 'Kunci Motor di Parkiran Sore',
    timestamp: 'PUKUL EMPAT SORE',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // PARKIRAN-TINGKAT',
    text: 'Gantungan kunci motor yang digenggam Raka di samping motornya saat langkah mereka melambat di area parkiran bertingkat. Sebuah ajakan keluar nanti malam yang sempat membuatnya gugup, disambut senyum cerah Risya.'
  },
  {
    id: 'shard-5',
    title: 'Genggaman Tangan di Tepian Jalan',
    timestamp: 'MALAM HARI // LAMPU TEMARAM',
    tag: 'CATATAN RAKA',
    code: 'DETAIL // JEMARI-BERTAUT',
    text: 'Jemari yang bertaut erat di atas bangku tepian jalan yang teduh. Risya yang melepas kacamatanya dan menyandarkan kepala dengan nyaman di bahu Raka, mengalirkan kehangatan tanpa perlu ada kata-kata yang diucapkan lagi.'
  }
];

export class Crystals {
  constructor(scene) {
    this.scene = scene;
    this.shards = [];
    this.hoveredShard = null;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initShards();
  }

  initShards() {
    const geometries = [
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.DodecahedronGeometry(1.1, 0)
    ];

    const shardPositions = [
      new THREE.Vector3(-3.5, 2.2, 18),   // Babak 00
      new THREE.Vector3(4.5, -1.2, -3),   // Babak 01
      new THREE.Vector3(-3.8, 2.0, -24),  // Babak 02
      new THREE.Vector3(5.2, 0.5, -48),   // Babak 03
      new THREE.Vector3(-4.2, -1.8, -72), // Babak 04
      new THREE.Vector3(2.5, 1.2, -102)   // Babak 05
    ];

    shardPositions.forEach((pos, index) => {
      const geo = geometries[index % geometries.length];

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xf8f9fa),
        emissive: new THREE.Color(0xffb703),
        emissiveIntensity: 0.28,
        roughness: 0.1,
        metalness: 0.08,
        transmission: 0.9,
        ior: 1.54,
        thickness: 1.6,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.96
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const memoryData = SHARD_MEMORIES[index % SHARD_MEMORIES.length];
      mesh.userData = {
        memory: memoryData,
        basePos: pos.clone(),
        baseScale: 1.0,
        targetScale: 1.0,
        targetEmissive: 0.28,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.4,
          z: (Math.random() - 0.5) * 0.3
        },
        phase: Math.random() * Math.PI * 2
      };

      this.group.add(mesh);
      this.shards.push(mesh);
    });

    this.createAmbientFragments();
  }

  createAmbientFragments() {
    const miniGeo = new THREE.TetrahedronGeometry(0.35, 0);
    const miniMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd166,
      emissive: 0xffb703,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      transmission: 0.7,
      transparent: true,
      opacity: 0.8
    });

    this.ambientFragments = [];

    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Mesh(miniGeo, miniMat);
      const z = -Math.random() * 120 + 20;
      mesh.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 14,
        z
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        basePos: mesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3
      };
      this.group.add(mesh);
      this.ambientFragments.push(mesh);
    }
  }

  update(delta, time) {
    this.shards.forEach((shard) => {
      const u = shard.userData;

      shard.position.y = u.basePos.y + Math.sin(time * 0.8 + u.phase) * 0.35;
      shard.position.x = u.basePos.x + Math.cos(time * 0.6 + u.phase) * 0.15;

      shard.rotation.x += u.rotSpeed.x * delta;
      shard.rotation.y += u.rotSpeed.y * delta;
      shard.rotation.z += u.rotSpeed.z * delta;

      const currentScale = shard.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, u.targetScale, 0.1);
      shard.scale.set(newScale, newScale, newScale);

      shard.material.emissiveIntensity = THREE.MathUtils.lerp(
        shard.material.emissiveIntensity,
        u.targetEmissive,
        0.1
      );
    });

    this.ambientFragments.forEach((frag) => {
      const u = frag.userData;
      frag.position.y = u.basePos.y + Math.sin(time * u.speed + u.phase) * 0.25;
      frag.rotation.x += 0.3 * delta;
      frag.rotation.y += 0.2 * delta;
    });
  }

  handlePointerMove(intersectedMesh) {
    if (this.hoveredShard && this.hoveredShard !== intersectedMesh) {
      this.hoveredShard.userData.targetScale = 1.0;
      this.hoveredShard.userData.targetEmissive = 0.28;
      this.hoveredShard = null;
    }

    if (intersectedMesh && this.shards.includes(intersectedMesh)) {
      this.hoveredShard = intersectedMesh;
      this.hoveredShard.userData.targetScale = 1.25;
      this.hoveredShard.userData.targetEmissive = 1.2;
      return true;
    }

    return false;
  }

  dispose() {
    this.shards.forEach((s) => {
      s.geometry.dispose();
      s.material.dispose();
    });
    this.ambientFragments.forEach((f) => {
      f.geometry.dispose();
      f.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
