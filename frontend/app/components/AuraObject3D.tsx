"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * AuraObject3D — the living 3D centerpiece.
 * Dark metallic torus knot + cyan wireframe halo + glowing breathing core.
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
      {/* Metallic shell */}
      <mesh>
        <torusKnotGeometry args={[1.35, 0.34, 220, 36]} />
        <meshPhysicalMaterial
          color="#0e0e0e"
          metalness={0.95}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive="#0a2a33"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Accent wireframe halo */}
      <mesh>
        <torusKnotGeometry args={[1.42, 0.4, 120, 18]} />
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Glowing core */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} />
      </mesh>

      <pointLight ref={light} color="#22d3ee" intensity={2.2} distance={12} />
    </group>
  );
}

export default function AuraObject3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 3, 5]} intensity={0.6} color="#22d3ee" />
      <directionalLight position={[-4, 2, 4]} intensity={1.1} />
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Object3D />
      </Float>
    </Canvas>
  );
}
