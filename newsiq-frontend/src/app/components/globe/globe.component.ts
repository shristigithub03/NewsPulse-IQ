import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-globe',
  standalone: true,
  template: '<div #globeContainer class="globe-container"></div>',
  styleUrls: ['./globe.component.scss']
})
export class GlobeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRef;
  @Input() autoRotate: boolean = true;
  @Input() category: string = 'all';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private earth!: THREE.Mesh;
  private pointsGroup!: THREE.Group;
  private animationId!: number;
  private isInitialized = false;

  private newsPoints = [
    { lat: 40.7128, lng: -74.0060, sentiment: 'positive' },  // New York
    { lat: 51.5074, lng: -0.1278, sentiment: 'negative' },   // London
    { lat: 48.8566, lng: 2.3522, sentiment: 'positive' },    // Paris
    { lat: 35.6762, lng: 139.6503, sentiment: 'neutral' },   // Tokyo
    { lat: 37.7749, lng: -122.4194, sentiment: 'positive' }, // San Francisco
    { lat: 19.0760, lng: 72.8777, sentiment: 'negative' },   // Mumbai
    { lat: -33.8688, lng: 151.2093, sentiment: 'positive' }, // Sydney
    { lat: -23.5505, lng: -46.6333, sentiment: 'neutral' },  // Sao Paulo
  ];

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    if (!this.isInitialized) {
      this.initThreeJS();
      this.isInitialized = true;
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS() {
    const container = this.globeContainer.nativeElement;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 8;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 15;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 5, 5);
    this.scene.add(directionalLight);

    // Create Earth
    this.createEarth();
    
    // Create news points
    this.createNewsPoints();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  private createEarth() {
    const geometry = new THREE.SphereGeometry(3, 64, 64);
    
    // Create blue Earth material
    const material = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      shininess: 100,
      specular: 0x222222,
      emissive: 0x0a3d91,
      emissiveIntensity: 0.2
    });

    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);

    // Add subtle grid lines
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true,
      opacity: 0.3 
    });
    const gridGeometry = new THREE.SphereGeometry(3.02, 32, 32);
    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(gridGeometry),
      gridMaterial
    );
    this.scene.add(grid);
  }

  private createNewsPoints() {
    this.pointsGroup = new THREE.Group();
    
    // Colors for different sentiments
    const colors = {
      positive: 0x10b981,  // green
      negative: 0xef4444,  // red
      neutral: 0xf59e0b    // yellow
    };

    // Create news points
    this.newsPoints.forEach((point, index) => {
      // Convert lat/lng to 3D coordinates
      const phi = (90 - point.lat) * Math.PI / 180;
      const theta = (point.lng + 180) * Math.PI / 180;
      
      const x = 3.2 * Math.sin(phi) * Math.cos(theta);
      const y = 3.2 * Math.cos(phi);
      const z = 3.2 * Math.sin(phi) * Math.sin(theta);
      
      // Create point light
      const pointLight = new THREE.PointLight(
        colors[point.sentiment as keyof typeof colors], 
        2, 
        5
      );
      pointLight.position.set(x, y, z);
      this.pointsGroup.add(pointLight);
      
      // Create glowing sphere
      const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: colors[point.sentiment as keyof typeof colors],
        transparent: true,
        opacity: 0.8
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(x, y, z);
      this.pointsGroup.add(sphere);

      // Create connecting line to Earth surface
      const lineMaterial = new THREE.LineBasicMaterial({
        color: colors[point.sentiment as keyof typeof colors],
        transparent: true,
        opacity: 0.3
      });
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x * 0.95, y * 0.95, z * 0.95)
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.pointsGroup.add(line);
    });
    
    this.scene.add(this.pointsGroup);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Auto rotate if enabled
    this.controls.autoRotate = this.autoRotate;

    // Make points pulse
    const time = Date.now() * 0.001;
    this.pointsGroup.children.forEach((child, index) => {
      if (child instanceof THREE.PointLight) {
        child.intensity = 1 + Math.sin(time * 3 + index) * 0.5;
      }
    });

    // Slowly rotate Earth itself
    if (this.autoRotate && this.earth) {
      this.earth.rotation.y += 0.001;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const container = this.globeContainer.nativeElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }

  resetView() {
    this.controls.reset();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.controls.autoRotate = this.autoRotate;
  }
}