/**
 * Example: Using Float64 Atomics with BRUTAL State Management
 * Demonstrates high-performance shared state with floating-point values
 */

import { State } from '../01-core/State.js';
import { Float64AtomicView, SeqLockFloat64Array } from '../01-core/Float64Atomics.js';

// Example 1: Physics Simulation with Shared State
class PhysicsSimulation {
  constructor() {
    // Create shared state for particle positions
    this.state = new State({
      particles: [],
      gravity: 9.81,
      deltaTime: 0.016
    }, {
      name: 'physics',
      shared: true,
      maxSize: 10 * 1024 * 1024 // 10MB for lots of particles
    });
    
    // Create specialized float64 view for particle data
    if (this.state.useSharedMemory) {
      this.setupSharedParticles();
    }
  }
  
  setupSharedParticles() {
    // Allocate space for 1000 particles (x, y, vx, vy per particle)
    const particlesPerBuffer = 1000;
    const floatsPerParticle = 4;
    const bufferSize = particlesPerBuffer * floatsPerParticle * 8;
    
    // Create dedicated buffer for particle data
    this.particleBuffer = new SharedArrayBuffer(bufferSize);
    this.particleView = new Float64AtomicView(this.particleBuffer);
    
    // Use seqlock for frequently read particle positions
    this.positionBuffer = new SharedArrayBuffer(particlesPerBuffer * 3 * 4); // 3 uint32 per float
    this.positionSeqLock = new SeqLockFloat64Array(this.positionBuffer, particlesPerBuffer * 2);
    
    // Store reference in state
    this.state.set('particleBuffer', this.particleBuffer);
    this.state.set('positionBuffer', this.positionBuffer);
  }
  
  addParticle(x, y, vx = 0, vy = 0) {
    const particles = this.state.get('particles');
    const id = particles.length;
    
    if (this.particleView) {
      const offset = id * 4;
      this.particleView.store(offset, x);
      this.particleView.store(offset + 1, y);
      this.particleView.store(offset + 2, vx);
      this.particleView.store(offset + 3, vy);
      
      // Also store in seqlock for fast reads
      this.positionSeqLock.write(id * 2, x);
      this.positionSeqLock.write(id * 2 + 1, y);
    }
    
    particles.push({ id, x, y, vx, vy });
    this.state.set('particles', particles);
    
    return id;
  }
  
  updatePhysics() {
    const gravity = this.state.get('gravity');
    const deltaTime = this.state.get('deltaTime');
    const particles = this.state.get('particles');
    
    if (this.particleView) {
      // Update using atomic operations
      for (let i = 0; i < particles.length; i++) {
        const offset = i * 4;
        
        // Read current values
        const x = this.particleView.load(offset);
        const y = this.particleView.load(offset + 1);
        const vx = this.particleView.load(offset + 2);
        const vy = this.particleView.load(offset + 3);
        
        // Update velocity (gravity)
        const newVy = vy + gravity * deltaTime;
        
        // Update position
        const newX = x + vx * deltaTime;
        const newY = y + newVy * deltaTime;
        
        // Store back atomically
        this.particleView.store(offset, newX);
        this.particleView.store(offset + 1, newY);
        this.particleView.store(offset + 2, vx);
        this.particleView.store(offset + 3, newVy);
        
        // Update seqlock for readers
        this.positionSeqLock.write(i * 2, newX);
        this.positionSeqLock.write(i * 2 + 1, newY);
      }
    }
  }
  
  // Fast read path for rendering
  getParticlePositions() {
    const particles = this.state.get('particles');
    const positions = [];
    
    if (this.positionSeqLock) {
      // Use seqlock for fast, consistent reads
      for (let i = 0; i < particles.length; i++) {
        positions.push({
          x: this.positionSeqLock.read(i * 2),
          y: this.positionSeqLock.read(i * 2 + 1)
        });
      }
    } else {
      // Fallback to regular state
      particles.forEach(p => {
        positions.push({ x: p.x, y: p.y });
      });
    }
    
    return positions;
  }
}

// Example 2: Real-time Audio Processing
class AudioProcessor {
  constructor() {
    // Shared audio buffer for multi-threaded processing
    const sampleRate = 48000;
    const bufferSeconds = 1;
    const channels = 2;
    
    this.sampleRate = sampleRate;
    this.bufferSize = sampleRate * bufferSeconds * channels;
    
    // Create shared audio buffer
    this.audioBuffer = new SharedArrayBuffer(this.bufferSize * 8);
    this.audioView = new Float64AtomicView(this.audioBuffer);
    
    // Write position tracking
    this.positionBuffer = new SharedArrayBuffer(8);
    this.writePosition = new Uint32Array(this.positionBuffer);
    
    // Initialize
    Atomics.store(this.writePosition, 0, 0);
  }
  
  // Producer: Write audio samples
  writeSamples(samples) {
    const writePos = Atomics.load(this.writePosition, 0);
    
    for (let i = 0; i < samples.length; i++) {
      const bufferIndex = (writePos + i) % this.bufferSize;
      this.audioView.store(bufferIndex, samples[i]);
    }
    
    // Update write position
    const newPos = (writePos + samples.length) % this.bufferSize;
    Atomics.store(this.writePosition, 0, newPos);
  }
  
  // Consumer: Read audio samples
  readSamples(count) {
    const samples = new Float64Array(count);
    const readPos = Atomics.load(this.writePosition, 0) - count;
    
    for (let i = 0; i < count; i++) {
      const bufferIndex = (readPos + i + this.bufferSize) % this.bufferSize;
      samples[i] = this.audioView.load(bufferIndex);
    }
    
    return samples;
  }
  
  // Apply effect (in worker thread)
  applyEffect(effectFn, startSample, endSample) {
    for (let i = startSample; i < endSample; i++) {
      const sample = this.audioView.load(i);
      const processed = effectFn(sample, i);
      this.audioView.store(i, processed);
    }
  }
}

// Example 3: Machine Learning Model Weights
class SharedNeuralNetwork {
  constructor(layers) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    
    // Calculate total weights needed
    let totalWeights = 0;
    let totalBiases = 0;
    
    for (let i = 0; i < layers.length - 1; i++) {
      totalWeights += layers[i] * layers[i + 1];
      totalBiases += layers[i + 1];
    }
    
    // Create shared buffers
    this.weightBuffer = new SharedArrayBuffer(totalWeights * 8);
    this.biasBuffer = new SharedArrayBuffer(totalBiases * 8);
    
    // Create atomic views
    this.weightView = new Float64AtomicView(this.weightBuffer);
    this.biasView = new Float64AtomicView(this.biasBuffer);
    
    // Initialize weights randomly
    this.initializeWeights();
  }
  
  initializeWeights() {
    // Xavier initialization
    let weightIndex = 0;
    let biasIndex = 0;
    
    for (let i = 0; i < this.layers.length - 1; i++) {
      const inputSize = this.layers[i];
      const outputSize = this.layers[i + 1];
      const limit = Math.sqrt(6 / (inputSize + outputSize));
      
      // Initialize weights
      for (let j = 0; j < inputSize * outputSize; j++) {
        const value = (Math.random() * 2 - 1) * limit;
        this.weightView.store(weightIndex++, value);
      }
      
      // Initialize biases to zero
      for (let j = 0; j < outputSize; j++) {
        this.biasView.store(biasIndex++, 0);
      }
    }
  }
  
  // Forward pass (can be parallelized across workers)
  forward(input, layerIndex, workerIndex = 0, numWorkers = 1) {
    const inputSize = this.layers[layerIndex];
    const outputSize = this.layers[layerIndex + 1];
    
    // Calculate weight offset
    let weightOffset = 0;
    for (let i = 0; i < layerIndex; i++) {
      weightOffset += this.layers[i] * this.layers[i + 1];
    }
    
    // Calculate bias offset
    let biasOffset = 0;
    for (let i = 0; i <= layerIndex; i++) {
      biasOffset += this.layers[i + 1];
    }
    
    // Divide work among workers
    const neuronsPerWorker = Math.ceil(outputSize / numWorkers);
    const startNeuron = workerIndex * neuronsPerWorker;
    const endNeuron = Math.min(startNeuron + neuronsPerWorker, outputSize);
    
    const output = new Float64Array(endNeuron - startNeuron);
    
    // Compute outputs for assigned neurons
    for (let i = startNeuron; i < endNeuron; i++) {
      let sum = this.biasView.load(biasOffset + i);
      
      for (let j = 0; j < inputSize; j++) {
        const weight = this.weightView.load(weightOffset + i * inputSize + j);
        sum += input[j] * weight;
      }
      
      // ReLU activation
      output[i - startNeuron] = Math.max(0, sum);
    }
    
    return output;
  }
  
  // Update weights (gradient descent)
  updateWeights(gradients, learningRate = 0.01) {
    for (let i = 0; i < gradients.weights.length; i++) {
      const oldWeight = this.weightView.load(i);
      const newWeight = oldWeight - learningRate * gradients.weights[i];
      this.weightView.store(i, newWeight);
    }
    
    for (let i = 0; i < gradients.biases.length; i++) {
      const oldBias = this.biasView.load(i);
      const newBias = oldBias - learningRate * gradients.biases[i];
      this.biasView.store(i, newBias);
    }
  }
}

// Example usage and demo
export function runFloat64Examples() {
  // Check environment
  if (!crossOriginIsolated) {
    return;
  }
  
  // Example 1: Physics simulation
  const physics = new PhysicsSimulation();
  
  // Add particles
  for (let i = 0; i < 100; i++) {
    physics.addParticle(
      Math.random() * 800,
      Math.random() * 600,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    );
  }
  
  // Run simulation
  const simStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    physics.updatePhysics();
  }
  const simTime = performance.now() - simStart;
  }ms`);
  
  // Example 2: Audio processing
  const audio = new AudioProcessor();
  
  // Generate test signal
  const testSamples = new Float64Array(48000);
  for (let i = 0; i < testSamples.length; i++) {
    testSamples[i] = Math.sin(2 * Math.PI * 440 * i / 48000);
  }
  
  // Write and read
  const audioStart = performance.now();
  audio.writeSamples(testSamples);
  const readSamples = audio.readSamples(1000);
  const audioTime = performance.now() - audioStart;
  }ms`);
  
  // Example 3: Neural network
  const nn = new SharedNeuralNetwork([784, 128, 64, 10]);
  
  // Test forward pass
  const input = new Float64Array(784).fill(0.5);
  const nnStart = performance.now();
  const output = nn.forward(input, 0);
  const nnTime = performance.now() - nnStart;
  }ms`);
  }

// Auto-run if loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('example')) {
  runFloat64Examples();
}