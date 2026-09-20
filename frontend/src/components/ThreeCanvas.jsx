import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeCanvas = ({ className = '', interactive = true }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070709, 0.025);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.z = 6.5;

    // High performance renderer with capped pixel ratio & disabled heavy tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    container.appendChild(renderer.domElement);

    // --- Lightweight Lighting (Zero multi-pass overhead) ---
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(4, 5, 4);
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 2.5, 18);
    purpleLight.position.set(-4, -3, 3);
    scene.add(purpleLight);

    // --- Core Holographic Group ---
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Shared Materials for optimal batching
    const wireMat1 = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });

    const wireMat2 = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });

    const glowCoreMat = new THREE.MeshLambertMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      transparent: true,
      opacity: 0.75,
    });

    // Central solid crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.9, 0);
    const crystalMesh = new THREE.Mesh(crystalGeo, glowCoreMat);
    coreGroup.add(crystalMesh);

    // Inner wireframe icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const innerMesh = new THREE.Mesh(innerGeo, wireMat1);
    coreGroup.add(innerMesh);

    // Outer wireframe lattice
    const outerGeo = new THREE.IcosahedronGeometry(2.0, 1);
    const outerMesh = new THREE.Mesh(outerGeo, wireMat2);
    coreGroup.add(outerMesh);

    // Sparkling vertex points
    const pointsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
    });
    const corePoints = new THREE.Points(outerGeo, pointsMat);
    coreGroup.add(corePoints);

    // --- Gyroscopic Orbital Rings ---
    const rings = [];
    const ringConfigs = [
      { radius: 2.6, tube: 0.014, color: 0x06b6d4, rotX: Math.PI / 3, speed: 0.007 },
      { radius: 3.0, tube: 0.012, color: 0x8b5cf6, rotX: -Math.PI / 4, speed: -0.005 },
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = cfg.rotX;
      coreGroup.add(ringMesh);
      rings.push({ mesh: ringMesh, speed: cfg.speed });
    });

    // --- Floating Lightweight Orbiting Shapes ---
    const floatingObjects = [];
    const sharedGeos = [
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.TetrahedronGeometry(0.38, 0),
    ];
    const sharedMats = [
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 }),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.4 }),
      new THREE.MeshLambertMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, transparent: true, opacity: 0.6 }),
    ];

    for (let i = 0; i < 10; i++) {
      const geo = sharedGeos[i % sharedGeos.length];
      const mat = sharedMats[i % sharedMats.length];
      const mesh = new THREE.Mesh(geo, mat);

      const distance = 4.2 + (i % 3) * 1.5;
      const angle = (i / 10) * Math.PI * 2;
      const ySpread = ((i % 5) - 2) * 1.2;

      mesh.position.set(
        distance * Math.cos(angle),
        ySpread,
        distance * Math.sin(angle)
      );

      scene.add(mesh);
      floatingObjects.push({
        mesh,
        rotSpeedX: 0.006 * (i % 2 === 0 ? 1 : -1),
        rotSpeedY: 0.008 * (i % 3 === 0 ? -1 : 1),
        baseY: ySpread,
        floatSpeed: 0.7 + (i % 4) * 0.25,
        floatOffset: i,
      });
    }

    // --- Lightweight Particle Field ---
    const particleCount = 750;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x06b6d4);
    const c2 = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const spread = 20;
      particlePositions[idx] = (Math.random() - 0.5) * spread;
      particlePositions[idx + 1] = (Math.random() - 0.5) * spread;
      particlePositions[idx + 2] = (Math.random() - 0.5) * spread;

      const col = i % 2 === 0 ? c1 : c2;
      particleColors[idx] = col.r;
      particleColors[idx + 1] = col.g;
      particleColors[idx + 2] = col.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Mouse Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let pulseScale = 1;
    let pulseTarget = 1;

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const halfW = window.innerWidth * 0.5;
      const halfH = window.innerHeight * 0.5;
      mouse.targetX = ((e.clientX - halfW) / halfW) * 0.4;
      mouse.targetY = -((e.clientY - halfH) / halfH) * 0.3;
    };

    const handleClick = () => {
      pulseTarget = 1.15;
      setTimeout(() => {
        pulseTarget = 1.0;
      }, 180);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);

    // --- Resize Handler ---
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // --- Smooth 60 FPS Render Loop ---
    let animationFrameId;
    let lastTime = performance.now();

    const animate = (currentTime) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) * 0.001, 0.1);
      lastTime = currentTime;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Pulse lerp
      pulseScale += (pulseTarget - pulseScale) * 0.15;

      // Core rotations
      coreGroup.rotation.y += 0.25 * delta;
      coreGroup.rotation.x = Math.sin(currentTime * 0.0008) * 0.12;
      coreGroup.scale.set(pulseScale, pulseScale, pulseScale);

      crystalMesh.rotation.y -= 0.5 * delta;
      innerMesh.rotation.x += 0.3 * delta;

      // Rings rotation
      for (let i = 0; i < rings.length; i++) {
        rings[i].mesh.rotation.z += rings[i].speed;
      }

      // Floating objects
      const timeSec = currentTime * 0.001;
      for (let i = 0; i < floatingObjects.length; i++) {
        const obj = floatingObjects[i];
        obj.mesh.rotation.x += obj.rotSpeedX;
        obj.mesh.rotation.y += obj.rotSpeedY;
        obj.mesh.position.y = obj.baseY + Math.sin(timeSec * obj.floatSpeed + obj.floatOffset) * 0.25;
      }

      // Particles gentle drift
      particles.rotation.y += 0.02 * delta;

      // Camera parallax
      camera.position.x = mouse.x * 1.5;
      camera.position.y = mouse.y * 1.0;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose resources
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default ThreeCanvas;
