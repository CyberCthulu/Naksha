import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpace } from './SpaceProvider'

// If you installed drei, you can replace this starfield with <Stars />
function StarPoints() {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = 1200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // random cube around origin
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  return (
    <points geometry={geom}>
      <pointsMaterial size={0.15} sizeAttenuation />
    </points>
  )
}

function FocusPlanet() {
  const { focusedPlanet } = useSpace()

  // no focus => render nothing (keeps GPU cost low)
  if (!focusedPlanet) return null

  // simple mapping for now (later: textures, rings, etc.)
  const color = useMemo(() => {
    switch (focusedPlanet) {
      case 'Sun': return '#ffcc55'
      case 'Moon': return '#cccccc'
      case 'Mars': return '#cc5533'
      case 'Jupiter': return '#d2b48c'
      case 'Saturn': return '#d8c07a'
      case 'Uranus': return '#7ad8d8'
      case 'Neptune': return '#4f79ff'
      case 'Venus': return '#e6c08a'
      case 'Mercury': return '#999999'
      case 'Pluto': return '#b08a7a'
      default: return '#ffffff'
    }
  }, [focusedPlanet])

  return (
    <mesh position={[0, 0, -8]}>
      <sphereGeometry args={[2.2, 48, 48]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
    </mesh>
  )
}

export default function SpaceBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 10], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />

        <StarPoints />
        <FocusPlanet />
      </Canvas>
    </View>
  )
}
