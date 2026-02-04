// components/space/SpaceBackground.tsx
import React, { useMemo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { Canvas, useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { useSpace } from './SpaceProvider'

function StarPoints() {
  const pointsRef = useRef<THREE.Points>(null!)
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = 5000
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
    }

    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

    useFrame((_, delta) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y += delta * 0.02
    pointsRef.current.rotation.x += delta * 0.005
  })

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        size={0.16}
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  )
}

function colorForPlanet(p: string | null) {
  switch (p) {
    case 'Sun': return '#f1be47'     
    case 'Moon': return '#a09f9f'    
    case 'Mars': return '#af2c08'    
    case 'Jupiter': return '#d2b48c'
    case 'Saturn': return '#d8c07a'
    case 'Uranus': return '#7ad8d8'
    case 'Neptune': return '#4f79ff'
    case 'Venus': return '#e6c08a'
    case 'Mercury': return '#999999'
    case 'Pluto': return '#b08a7a'
    default: return '#ffffff'
  }
}

function FocusPlanet() {
  const { focusedPlanet } = useSpace()

  // ✅ Always call hooks the same way: compute color regardless
  const color = useMemo(() => colorForPlanet(focusedPlanet), [focusedPlanet])

  // ✅ Return null after hooks is fine
  if (!focusedPlanet) return null

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
      <Canvas frameloop="always" camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach='background' args={['#000']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <StarPoints />
        <FocusPlanet />
      </Canvas>
    </View>
  )
}
