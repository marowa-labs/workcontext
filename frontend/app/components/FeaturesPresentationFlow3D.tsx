"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

export interface Feature3DItem {
  icon?: React.ElementType | null;
  title: string;
  color: string;
  description: string;
}

interface FeatureCubeProps {
  feature: Feature3DItem;
  position: [number, number, number];
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}

function FeatureCube({
  feature,
  position,
  index,
  active,
  onSelect,
  onHover,
}: FeatureCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Continuous rotation + floating via useFrame
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const speed = active ? 1.2 : hovered ? 0.8 : 0.35;
    meshRef.current.rotation.x += delta * speed * 0.6;
    meshRef.current.rotation.y += delta * speed;
    // Gentle bob
    meshRef.current.position.y =
      position[1] +
      Math.sin(state.clock.elapsedTime * 1.5 + index * 1.1) * 0.25;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(index);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
        scale={active ? 1.35 : hovered ? 1.2 : 1}
      >
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial
          color={feature.color}
          emissive={feature.color}
          emissiveIntensity={active ? 0.55 : hovered ? 0.35 : 0.12}
          roughness={0.25}
          metalness={0.6}
          transparent
          opacity={0.92}
        />
        {/* Wireframe shell for a techy look */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.62, 1.62, 1.62)]} />
          <lineBasicMaterial color="#ffffff" transparent opacity={0.35} />
        </lineSegments>
      </mesh>
      {/* Floating label */}
      <Text
        position={[0, -1.6, 0]}
        fontSize={0.32}
        color="#ffffff"
        anchorX="center"
        anchorY="top"
        maxWidth={4}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {feature.title}
      </Text>
    </group>
  );
}

interface Feature3DSceneProps {
  features: Feature3DItem[];
  height?: number;
}

export function Feature3DScene({
  features,
  height = 460,
}: Feature3DSceneProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Arrange cubes in a circle
  const positions = useMemo<[number, number, number][]>(
    () =>
      features.map((_, i) => {
        const angle = (i / features.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 3.4;
        return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
          number,
          number,
          number,
        ];
      }),
    [features.length],
  );

  return (
    <div className="relative w-full">
      <Canvas
        style={{ height: `${height}px`, width: "100%" }}
        camera={{ position: [0, 1.5, 9], fov: 55 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight intensity={1.4} position={[6, 8, 6]} />
        <pointLight intensity={0.8} position={[-6, -4, -6]} color="#8b5cf6" />
        <pointLight intensity={0.6} position={[6, -4, 4]} color="#3b82f6" />

        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
          <group>
            {features.map((feature, i) => (
              <FeatureCube
                key={i}
                feature={feature}
                position={positions[i]}
                index={i}
                active={activeIndex === i}
                onSelect={setActiveIndex}
                onHover={setHoveredIndex}
              />
            ))}
          </group>
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Active feature caption */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p className="text-sm text-gray-400 max-w-md mx-auto px-4">
          {features[activeIndex]?.description}
        </p>
      </motion.div>

      {/* Hovered feature caption */}
      {hoveredIndex !== null && hoveredIndex !== activeIndex && (
        <motion.div
          key={`hover-${hoveredIndex}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-center pointer-events-none"
        >
          <p className="text-xs text-purple-300 max-w-md mx-auto px-4">
            {features[hoveredIndex]?.title}
          </p>
        </motion.div>
      )}

      {/* Interactive hint */}
      <div className="absolute top-2 right-4 text-xs text-gray-500 pointer-events-none">
        Drag to orbit · Click a cube
      </div>
    </div>
  );
}

export function FeaturesPresentationFlow3D() {
  const features: Feature3DItem[] = [
    {
      icon: null,
      title: "AI Chat",
      color: "#a855f7",
      description:
        "Chat with AI that searches across your connected tools alongside your workspace.",
    },
    {
      icon: null,
      title: "Dual-Mode Editor",
      color: "#3b82f6",
      description:
        "Switch between TipTap rich-text and BlockNote block-based editing in the same document.",
    },
    {
      icon: null,
      title: "Global Search",
      color: "#10b981",
      description:
        "Search workspaces, projects, tasks, members, chats, docs, and connected tools in parallel.",
    },
    {
      icon: null,
      title: "@ Mentions",
      color: "#06b6d4",
      description:
        "Mention teammates, pages, tasks, or connected tools anywhere in your documents.",
    },
    {
      icon: null,
      title: "Memory Layer",
      color: "#f59e0b",
      description:
        "Track decisions, view activity timelines, and generate AI summaries in one place.",
    },
    {
      icon: null,
      title: "Task Management",
      color: "#22c55e",
      description:
        "Organize work with tasks, subtasks, priorities, and due dates. Extract tasks from documents.",
    },
  ];

  return (
    <section className="relative py-16 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Explore the Platform in 3D
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Drag to orbit the scene, hover cubes to highlight, and click to
            learn about each capability.
          </p>
        </div>
        <Feature3DScene features={features} />
      </div>
    </section>
  );
}
