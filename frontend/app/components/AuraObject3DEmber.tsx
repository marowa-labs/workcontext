"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * AuraObject3DEmber — warm variant of the living 3D centerpiece.
 * Machined metallic ring (a "delivery portal") + ember wireframe halo + glowing core.
 * Rotates toward the mouse (smoothed via state.pointer), drifts with drei Float.
 */
function Object3D() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current || !core.current || !light.current) return;

    // Mouse-follow rotation (smoothed by R3F pointer lerp)
    const { x, y } = state.pointer;
    group.current.rotation.y += 0.0035;
    group.current.rotation.x = y * 0.45;
    group.current.rotation.z = x * 0.18;

    // Breathing core + light
    core.current.scale.setScalar(0.75 + Math.sin(t * 1.6) * 0.25);
    light.current.intensity = 1.6 + Math.sin(t * 1.6) * 0.8;
  });

  return (
    <group ref={group}>
      {/* Metallic ring shell */}
      <mesh>
        <torusGeometry args={[1.35, 0.32, 48, 96]} />
        <meshPhysicalMaterial
          color="#0e0e0e"
          metalness={0.95}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive="#2a1608"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Accent wireframe halo */}
      <mesh>
        <torusGeometry args={[1.62, 0.42, 24, 72]} />
        <meshBasicMaterial
          color="#fb923c"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Glowing core */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.9} />
      </mesh>

      <pointLight ref={light} color="#fb923c" intensity={2.2} distance={12} />
    </group>
  );
}

export default function AuraObject3DEmber() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 3, 5]} intensity={0.6} color="#fb923c" />
      <directionalLight position={[-4, 2, 4]} intensity={1.1} />
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Object3D />
      </Float>
    </Canvas>
  );
}
