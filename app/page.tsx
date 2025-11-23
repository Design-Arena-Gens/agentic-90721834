"use client";

/* eslint-disable react/no-unknown-property */

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PerspectiveCamera, SoftShadows } from "@react-three/drei";
import {
  Color,
  DoubleSide,
  Euler,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Vector3,
  CanvasTexture
} from "three";
import { useMemo, useRef } from "react";

function useHieroglyphTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glyphPalette = ["#c0a070", "#b8945c", "#d8b47c", "#a88455"];
    const glyphRows = 22;
    const glyphCols = 6;
    const cellW = canvas.width / glyphCols;
    const cellH = canvas.height / glyphRows;

    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${cellH * 0.54}px 'Papyrus', 'Noto Sans Egyptian Hieroglyphs', serif`;

    for (let row = 0; row < glyphRows; row++) {
      for (let col = 0; col < glyphCols; col++) {
        const paletteIndex = Math.floor(Math.random() * glyphPalette.length);
        ctx.fillStyle = glyphPalette[paletteIndex];
        const x = col * cellW + cellW / 2;
        const y = row * cellH + cellH / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(MathUtils.degToRad(Math.random() * 12 - 6));
        const glyphSeed = (row * glyphCols + col) % 10;
        const glyphMap = ["𓂀", "𓆑", "𓃭", "𓇋", "𓏏", "𓆓", "𓅓", "𓉡", "𓎛", "𓇳"];
        const glyph = glyphMap[glyphSeed] ?? "𓏏";
        ctx.fillText(glyph, 0, 0);
        ctx.restore();
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 2);
    texture.anisotropy = 8;

    return texture;
  }, []);
}

function HieroglyphWall(props: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  height: number;
  emissive?: string;
}) {
  const texture = useHieroglyphTexture();
  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: new Color("#4b3521"),
      emissive: new Color("#120b06"),
      emissiveIntensity: 0.45,
      map: texture ?? undefined,
      roughness: 0.75,
      metalness: 0.05,
      side: DoubleSide
    });
    return mat;
  }, [texture]);

  return (
    <mesh
      position={props.position}
      rotation={
        props.rotation
          ? new Euler(props.rotation[0], props.rotation[1], props.rotation[2])
          : undefined
      }
    >
      <planeGeometry args={[props.width, props.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function StoneFloor() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.fillStyle = "#1f1710";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grains = 2200;
    for (let i = 0; i < grains; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.4;
      const opacity = Math.random() * 0.4 + 0.1;
      ctx.fillStyle = `rgba(${110 + Math.random() * 20}, ${
        82 + Math.random() * 10
      }, ${60 + Math.random() * 10}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(6, 6);
    texture.anisotropy = 8;
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[12, 16]} />
      <meshStandardMaterial
        color="#35281b"
        roughness={0.85}
        map={texture ?? undefined}
      />
    </mesh>
  );
}

function Sarcophagus() {
  return (
    <group position={[0, 1, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 0.6, 1.5]} />
        <meshStandardMaterial
          color="#5a3b24"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.35, 3]} />
        <meshStandardMaterial
          color="#c4aa7a"
          roughness={0.55}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.34, 2.6]} />
        <meshStandardMaterial
          color="#dbc49a"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <planeGeometry args={[3.5, 1.2]} />
        <meshStandardMaterial
          color="#d0b48c"
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Torch(props: {
  position: [number, number, number];
  rotation?: [number, number, number];
  intensity?: number;
}) {
  const flameRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 12 + props.position[0]) * 0.08;
      flameRef.current.scale.setScalar(scale);
      const material = flameRef.current.material as MeshStandardMaterial;
      material.opacity = 0.75 + Math.sin(t * 10) * 0.12;
    }
  });

  return (
    <group position={props.position} rotation={props.rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#3b2914" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <torusGeometry args={[0.2, 0.05, 12, 32]} />
        <meshStandardMaterial color="#5a492c" roughness={0.6} />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.1, 0]} scale={1.2}>
        <sphereGeometry args={[0.25, 20, 20]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ff9b2f"
          emissiveIntensity={1.9}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight
        position={[0, 1.1, 0]}
        intensity={props.intensity ?? 20}
        distance={8}
        decay={2.5}
        color="#ffbf5f"
        castShadow
      />
    </group>
  );
}

type PriestProps = {
  position: [number, number, number];
  lookAt?: Vector3;
  color?: string;
};

function Priest({ position, lookAt, color }: PriestProps) {
  const groupRef = useRef<Group>(null);
  useFrame(() => {
    if (groupRef.current && lookAt) {
      groupRef.current.lookAt(lookAt);
    }
  });
  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.8]} />
        <meshStandardMaterial color={color ?? "#b79c73"} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1, 0.35]} />
        <meshStandardMaterial color="#2a1c10" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.16, 0.18]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#d4c6a5" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SmokeColumn(props: {
  count: number;
  spread: number;
  height: number;
  position: [number, number, number];
}) {
  const group = useRef<Group>(null);
  const planes = useMemo(() => {
    const list: {
      position: Vector3;
      rotation: Euler;
      scale: number;
      speed: number;
      drift: Vector3;
    }[] = [];
    for (let i = 0; i < props.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * props.spread;
      const height = Math.random() * props.height;
      const scale = Math.random() * 0.7 + 0.4;
      const speed = Math.random() * 0.3 + 0.25;
      const drift = new Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.25 + 0.12,
        (Math.random() - 0.5) * 0.2
      );
      list.push({
        position: new Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ),
        rotation: new Euler(0, 0, Math.random() * Math.PI),
        scale,
        speed,
        drift
      });
    }
    return list;
  }, [props.count, props.height, props.spread]);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      10,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.6)");
    gradient.addColorStop(0.4, "rgba(200,200,200,0.4)");
    gradient.addColorStop(1, "rgba(80,80,80,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new CanvasTexture(canvas);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    planes.forEach((plane, index) => {
      const mesh = group.current?.children[index] as Mesh | undefined;
      if (!mesh) return;
      const oscillation = Math.sin(t * plane.speed + index) * 0.35;
      mesh.position.set(
        plane.position.x + plane.drift.x * t + oscillation * 0.15,
        plane.position.y + plane.drift.y * t * 0.35,
        plane.position.z + plane.drift.z * t + Math.cos(t + index) * 0.05
      );
      mesh.scale.setScalar(
        plane.scale * (1 + Math.sin(t * 0.5 + index) * 0.1)
      );
      const material = mesh.material as MeshBasicMaterial;
      material.opacity = 0.25 + Math.sin(t * 0.3 + index) * 0.06;
    });
  });

  return (
    <group ref={group} position={props.position}>
      {planes.map((plane, idx) => (
        <mesh
          key={idx}
          rotation={plane.rotation}
          castShadow={false}
          receiveShadow={false}
        >
          <planeGeometry args={[1.4, 1.6]} />
          <meshBasicMaterial
            map={texture ?? undefined}
            transparent
            depthWrite={false}
            opacity={0.35}
            color="#c9b8a3"
          />
        </mesh>
      ))}
    </group>
  );
}

function WorkshopScene() {
  const focusPoint = useMemo(() => new Vector3(0, 1, 0), []);
  return (
    <>
      <fog attach="fog" args={["#07060b", 12, 24]} />
      <color attach="background" args={["#09060c"]} />
      <ambientLight intensity={0.18} color="#30201a" />
      <SoftShadows size={18} samples={14} focus={0.5} />

      <HieroglyphWall position={[0, 2.5, -6]} width={10} height={5} />
      <HieroglyphWall
        position={[-5, 2.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={12}
        height={5}
      />
      <HieroglyphWall
        position={[5, 2.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={12}
        height={5}
      />

      <StoneFloor />
      <Sarcophagus />

      <group position={[0, 0, 0]}>
        <Priest position={[-1.4, 0, 0.6]} lookAt={focusPoint} />
        <Priest position={[1.4, 0, 0.5]} lookAt={focusPoint} color="#c7ad82" />
        <Priest position={[0, 0, -1.2]} lookAt={focusPoint} color="#a9926d" />
      </group>

      <Torch position={[-3.8, 1.2, -4.8]} intensity={28} />
      <Torch position={[3.8, 1.2, -4.6]} intensity={24} />
      <Torch position={[-3.5, 1.2, 4.5]} intensity={18} />
      <Torch position={[3.5, 1.2, 4.4]} intensity={18} />

      <pointLight
        position={[0, 3.5, 1]}
        intensity={6}
        distance={12}
        decay={2}
        color="#ffdfaa"
        castShadow
      />

      <SmokeColumn count={16} spread={1.4} height={3.5} position={[0, 1.6, 0]} />
      <SmokeColumn
        count={12}
        spread={1.2}
        height={2.4}
        position={[-2.6, 1.4, -0.6]}
      />

      <Environment preset="sunset" />
      <spotLight
        position={[0, 4.8, 4.2]}
        angle={MathUtils.degToRad(24)}
        penumbra={0.45}
        intensity={6}
        color="#f4d7a2"
        distance={18}
        castShadow
      />
    </>
  );
}

export default function Page() {
  return (
    <div className="page">
      <div className="floating-smoke" />
      <h1 className="title">Per-nefer Embalming Workshop</h1>
      <Canvas
        shadows
        dpr={[1, 1.8]}
        gl={{ toneMappingExposure: 1.25 }}
        style={{
          width: "min(96vw, 1200px)",
          height: "min(70vh, 720px)",
          borderRadius: "18px",
          boxShadow: "0 40px 120px rgba(0, 0, 0, 0.8)",
          background:
            "radial-gradient(circle at center, rgba(18,12,6,0.7), rgba(2,2,2,0.95))"
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 2.6, 9.5]}
          fov={36}
          near={0.1}
          far={45}
        />
        <WorkshopScene />
      </Canvas>
      <p className="description">
        A 10-meter wide cinematic glimpse inside the sacred Per-nefer chamber,
        where embalmers labor by torchlight to prepare a noble for the journey
        beyond. Smoke, hieroglyphs, and polished stone amplify the dramatic,
        wide-angle realism.
      </p>
    </div>
  );
}
