'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function MedicalHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.035);

    // 2. Camera setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xccfbf1, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0d9488, 3.5);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 3.0);
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x2dd4bf, 4, 30);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // 5. DNA Double Helix Group
    const dnaGroup = new THREE.Group();

    const strand1Geometry = new THREE.SphereGeometry(0.12, 16, 16);
    const strand2Geometry = new THREE.SphereGeometry(0.12, 16, 16);
    const connectorGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);

    const material1 = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x042f2e,
      emissiveIntensity: 0.6,
    });

    const material2 = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x082f49,
      emissiveIntensity: 0.6,
    });

    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.5,
      transparent: true,
      opacity: 0.65,
    });

    const numPoints = 36;
    const radius = 2.0;
    const heightSpan = 10;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 4;
      const y = (i / numPoints) * heightSpan - heightSpan / 2;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;

      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      // Sphere 1
      const s1 = new THREE.Mesh(strand1Geometry, material1);
      s1.position.set(x1, y, z1);
      dnaGroup.add(s1);

      // Sphere 2
      const s2 = new THREE.Mesh(strand2Geometry, material2);
      s2.position.set(x2, y, z2);
      dnaGroup.add(s2);

      // Connector rung
      const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
      const midpoint = new THREE.Vector3((x1 + x2) / 2, y, (z1 + z2) / 2);
      connector.position.copy(midpoint);
      connector.scale.set(1, radius * 2, 1);
      connector.rotation.z = Math.PI / 2;
      connector.rotation.y = -angle;
      dnaGroup.add(connector);
    }

    scene.add(dnaGroup);

    // 6. Central Pulsing Organic Core (Cellular Model)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 7. Floating Medical Particles (Blood cells & neural nodes)
    const particlesCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 16;
      positions[i + 2] = (Math.random() - 0.5) * 16;

      // Teal/Cyan/White gradient
      const isTeal = Math.random() > 0.5;
      colors[i] = isTeal ? 0.05 : 0.0;
      colors[i + 1] = isTeal ? 0.72 : 0.51;
      colors[i + 2] = isTeal ? 0.65 : 0.88;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // 8. Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = -(y / rect.height) * 2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 9. Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    setIsReady(true);

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // DNA rotation
      dnaGroup.rotation.y = elapsedTime * 0.45;
      dnaGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.35;

      // Core pulse
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.08;
      coreMesh.scale.set(pulse, pulse, pulse);
      coreMesh.rotation.x = elapsedTime * 0.3;
      coreMesh.rotation.y = elapsedTime * 0.4;

      // Particle floating
      particlesMesh.rotation.y = -elapsedTime * 0.08;
      particlesMesh.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;

      // Smooth mouse follow
      targetRotationY += (mouseX * 0.4 - targetRotationY) * 0.05;
      targetRotationX += (mouseY * 0.4 - targetRotationX) * 0.05;

      dnaGroup.rotation.z = targetRotationX;
      dnaGroup.rotation.x = targetRotationY;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      strand1Geometry.dispose();
      strand2Geometry.dispose();
      connectorGeometry.dispose();
      material1.dispose();
      material2.dispose();
      connectorMaterial.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] md:h-[500px] flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 shadow-2xl border border-teal-500/20">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Subtle UI Overlay Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-500/30 text-teal-300 text-xs shadow-lg">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
        <span className="font-semibold tracking-wide">مجسم ثلاثي الأبعاد تفاعلي (Three.js 3D)</span>
      </div>

      {/* Medical Interactive Hint */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/75 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-700/50 text-[11px] text-slate-300">
        <span>حرّك المؤشر لاستكشاف السلسلة الوراثية والتركيب الخلوي 🧬</span>
      </div>

      {/* Loading state before canvas init */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-teal-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            <span>جارِ تهيئة البيئة ثلاثية الأبعاد...</span>
          </div>
        </div>
      )}
    </div>
  );
}
