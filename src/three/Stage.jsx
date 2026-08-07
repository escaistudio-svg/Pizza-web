import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'

/**
 * Lighting rig. Everything here is procedural — the environment map is built
 * from Lightformers in a cube camera pass, so there's no HDRI to download and
 * the whole site works offline.
 *
 * The look: one warm key from the upper right (an oven mouth), a cool bounce
 * from the left to keep shadows from going muddy, and a hot rim behind so the
 * cheese gets a wet specular edge.
 */
export function Stage({ shadows = true, intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.2 * intensity} color="#FFE6C8" />

      {/* key — the oven */}
      <directionalLight
        position={[5.5, 8, 4]}
        intensity={1.15 * intensity}
        color="#FFE2B4"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.1, 30]} />
      </directionalLight>

      {/* cool fill */}
      <directionalLight position={[-6, 4, 2]} intensity={0.3 * intensity} color="#CFE0FF" />

      {/* rim — puts the shine on the cheese */}
      <spotLight
        position={[-2, 6, -7]}
        angle={0.9}
        penumbra={1}
        intensity={7 * intensity}
        color="#FFD9A0"
      />

      {/* bounce off the "counter" */}
      <pointLight position={[0, -3, 2]} intensity={1.2 * intensity} color="#F7C98E" distance={14} />

      <Environment resolution={256} frames={1}>
        <mesh scale={80}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshBasicMaterial color="#6B5A47" side={THREE.BackSide} />
        </mesh>
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 6, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[12, 12, 1]}
          color="#FFF4E2"
        />
        <Lightformer
          form="circle"
          intensity={3.4}
          position={[5, 3, -4]}
          scale={[6, 6, 1]}
          color="#FFCE96"
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-6, 2, 3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 6, 1]}
          color="#CFE0FF"
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[0, -4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          color="#E9BE86"
        />
      </Environment>
    </>
  )
}

export default Stage
