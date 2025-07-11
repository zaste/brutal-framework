/**
 * BRUTAL Framework V3 - Mobile Optimization Test
 * Tests performance and touch interactions on mobile devices
 */

class MobileOptimizationTest {
    constructor() {
        this.metrics = {
            fps: [],
            touches: 0,
            swipes: 0,
            scrollEvents: 0,
            renderTime: []
        };
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        this.init();
    }

    init() {
        this.setupDeviceInfo();
        this.setupTouchHandlers();
        this.setupScrollTest();
        this.setupOrientationHandlers();
        this.setupBatteryMonitoring();
        this.setupPerformanceMonitoring();
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.scroll-test')) return;
            e.preventDefault();
        }, { passive: false });
    }

    setupDeviceInfo() {
        // Screen info
        document.getElementById('screenSize').textContent = 
            `${window.innerWidth}×${window.innerHeight}`;
        
        // Pixel ratio
        document.getElementById('pixelRatio').textContent = 
            `${window.devicePixelRatio}x`;
        
        // Touch points
        document.getElementById('touchPoints').textContent = 
            navigator.maxTouchPoints || 'N/A';
        
        // Connection
        if ('connection' in navigator) {
            const conn = navigator.connection;
            document.getElementById('connection').textContent = 
                conn.effectiveType || 'Unknown';
        }
        
        // Update on resize/orientation change
        window.addEventListener('resize', () => {
            document.getElementById('screenSize').textContent = 
                `${window.innerWidth}×${window.innerHeight}`;
        });
    }

    setupTouchHandlers() {
        const touchArea = document.getElementById('touchArea');
        const indicator = touchArea.querySelector('.gesture-indicator');
        let touchCount = 0;
        let swipeCount = 0;
        
        // Touch start
        touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            touchArea.classList.add('active');
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
            
            // Show touch indicator
            const rect = touchArea.getBoundingClientRect();
            indicator.style.left = (e.touches[0].clientX - rect.left - 20) + 'px';
            indicator.style.top = (e.touches[0].clientY - rect.top - 20) + 'px';
            indicator.classList.add('show');
            
            document.getElementById('gestureInfo').textContent = 
                `Touch started at ${Math.round(this.touchStartX)}, ${Math.round(this.touchStartY)}`;
        }, { passive: false });
        
        // Touch move
        touchArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - this.touchStartX;
            const deltaY = currentY - this.touchStartY;
            
            document.getElementById('gestureInfo').textContent = 
                `Moving: Δx=${Math.round(deltaX)}, Δy=${Math.round(deltaY)}`;
        }, { passive: false });
        
        // Touch end
        touchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            touchArea.classList.remove('active');
            indicator.classList.remove('show');
            
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - this.touchStartTime;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - this.touchStartX;
            const deltaY = endY - this.touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Detect gesture type
            if (distance < 10 && touchDuration < 200) {
                // Tap
                touchCount++;
                document.getElementById('tapCount').textContent = touchCount;
                document.getElementById('gestureInfo').textContent = 'Tap detected!';
                document.getElementById('touchStatus').className = 'status-badge success';
                document.getElementById('touchStatus').textContent = 'Working';
            } else if (distance > 50) {
                // Swipe
                swipeCount++;
                document.getElementById('swipeCount').textContent = swipeCount;
                
                let direction = '';
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    direction = deltaX > 0 ? 'Right' : 'Left';
                } else {
                    direction = deltaY > 0 ? 'Down' : 'Up';
                }
                
                document.getElementById('gestureInfo').textContent = 
                    `Swipe ${direction} (${Math.round(distance)}px in ${touchDuration}ms)`;
            }
        }, { passive: false });
        
        // Multi-touch
        touchArea.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                document.getElementById('gestureInfo').textContent = 
                    `Multi-touch: ${e.touches.length} fingers`;
            }
        });
    }

    setupScrollTest() {
        const scrollTest = document.getElementById('scrollTest');
        
        // Generate scroll items
        for (let i = 0; i < 100; i++) {
            const item = document.createElement('div');
            item.className = 'scroll-item';
            item.textContent = `Item ${i + 1} - Scroll performance test`;
            scrollTest.appendChild(item);
        }
        
        // Monitor scroll performance
        let scrolling = false;
        let scrollStartTime = 0;
        let lastScrollTop = 0;
        
        scrollTest.addEventListener('touchstart', () => {
            scrolling = true;
            scrollStartTime = performance.now();
            lastScrollTop = scrollTest.scrollTop;
            document.getElementById('scrollStatus').className = 'status-badge running';
            document.getElementById('scrollStatus').textContent = 'Scrolling';
        });
        
        scrollTest.addEventListener('touchend', () => {
            scrolling = false;
            const scrollEndTime = performance.now();
            const scrollDuration = scrollEndTime - scrollStartTime;
            const scrollDistance = Math.abs(scrollTest.scrollTop - lastScrollTop);
            const scrollSpeed = scrollDistance / scrollDuration;
            
            document.getElementById('scrollStatus').className = 'status-badge success';
            document.getElementById('scrollStatus').textContent = 
                `${scrollSpeed.toFixed(1)} px/ms`;
        });
        
        // Passive scroll listener for performance
        scrollTest.addEventListener('scroll', () => {
            this.metrics.scrollEvents++;
        }, { passive: true });
    }

    setupOrientationHandlers() {
        if ('DeviceOrientationEvent' in window) {
            // Request permission on iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const requestPermission = () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(response => {
                            if (response === 'granted') {
                                this.addOrientationListeners();
                            }
                        })
                        .catch(console.error);
                };
                
                // Add button to request permission
                const orientCard = document.querySelector('#orientStatus').parentElement.parentElement;
                const btn = document.createElement('button');
                btn.className = 'button';
                btn.textContent = 'Enable Orientation';
                btn.onclick = requestPermission;
                orientCard.querySelector('.test-content').appendChild(btn);
            } else {
                this.addOrientationListeners();
            }
        } else {
            document.getElementById('orientStatus').className = 'status-badge error';
            document.getElementById('orientStatus').textContent = 'Not Supported';
        }
    }

    addOrientationListeners() {
        window.addEventListener('deviceorientation', (e) => {
            document.getElementById('alpha').textContent = 
                e.alpha ? `${Math.round(e.alpha)}°` : 'N/A';
            document.getElementById('beta').textContent = 
                e.beta ? `${Math.round(e.beta)}°` : 'N/A';
            document.getElementById('gamma').textContent = 
                e.gamma ? `${Math.round(e.gamma)}°` : 'N/A';
        });
        
        document.getElementById('orientStatus').className = 'status-badge success';
        document.getElementById('orientStatus').textContent = 'Active';
    }

    async setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                const updateBatteryInfo = () => {
                    document.getElementById('batteryLevel').textContent = 
                        `${Math.round(battery.level * 100)}%`;
                    document.getElementById('batteryCharging').textContent = 
                        battery.charging ? 'Yes' : 'No';
                    
                    const status = document.getElementById('batteryStatus');
                    if (battery.level < 0.2) {
                        status.className = 'status-badge error';
                        status.textContent = 'Low';
                    } else if (battery.charging) {
                        status.className = 'status-badge success';
                        status.textContent = 'Charging';
                    } else {
                        status.className = 'status-badge warning';
                        status.textContent = 'Discharging';
                    }
                };
                
                updateBatteryInfo();
                battery.addEventListener('levelchange', updateBatteryInfo);
                battery.addEventListener('chargingchange', updateBatteryInfo);
                
            } catch (error) {
                document.getElementById('batteryStatus').className = 'status-badge error';
                document.getElementById('batteryStatus').textContent = 'Not Available';
            }
        } else {
            document.getElementById('batteryStatus').className = 'status-badge error';
            document.getElementById('batteryStatus').textContent = 'Not Supported';
        }
    }

    setupPerformanceMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        const fpsHistory = [];
        const perfGraph = document.getElementById('perfGraph');
        
        const measureFPS = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
                const fps = Math.round((frames * 1000) / delta);
                fpsHistory.push(fps);
                
                // Keep last 60 samples
                if (fpsHistory.length > 60) {
                    fpsHistory.shift();
                }
                
                // Update display
                document.getElementById('currentFPS').textContent = fps;
                document.getElementById('avgFPS').textContent = 
                    Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
                
                // Update graph
                this.updatePerfGraph(fpsHistory);
                
                frames = 0;
                lastTime = currentTime;
            }
            
            frames++;
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    updatePerfGraph(fpsHistory) {
        const graph = document.getElementById('perfGraph');
        graph.innerHTML = '';
        
        const width = graph.clientWidth;
        const height = graph.clientHeight;
        const barWidth = width / 60;
        
        fpsHistory.forEach((fps, index) => {
            const bar = document.createElement('div');
            bar.className = 'fps-line';
            bar.style.left = `${index * barWidth}px`;
            bar.style.height = `${(fps / 60) * height}px`;
            bar.style.width = `${barWidth - 1}px`;
            
            // Color based on FPS
            if (fps >= 55) {
                bar.style.background = 'var(--success)';
            } else if (fps >= 30) {
                bar.style.background = 'var(--warning)';
            } else {
                bar.style.background = 'var(--error)';
            }
            
            graph.appendChild(bar);
        });
    }

    async runPerformanceTest() {
        const status = document.getElementById('perfStatus');
        status.className = 'status-badge running';
        status.textContent = 'Testing...';
        
        // Create heavy DOM manipulation test
        const testContainer = document.createElement('div');
        testContainer.style.position = 'absolute';
        testContainer.style.left = '-9999px';
        document.body.appendChild(testContainer);
        
        const startTime = performance.now();
        const operations = 1000;
        
        // Test 1: DOM manipulation
        for (let i = 0; i < operations; i++) {
            const elem = document.createElement('div');
            elem.textContent = `Test ${i}`;
            elem.style.transform = `translateX(${i}px)`;
            testContainer.appendChild(elem);
        }
        
        // Test 2: Style changes
        const elements = testContainer.querySelectorAll('div');
        elements.forEach((elem, i) => {
            elem.style.backgroundColor = `hsl(${i % 360}, 50%, 50%)`;
            elem.style.opacity = Math.random();
        });
        
        // Test 3: Animations
        elements.forEach((elem, i) => {
            elem.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.2)' },
                { transform: 'scale(1)' }
            ], {
                duration: 300,
                delay: i * 2
            });
        });
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(testContainer);
        }, 2000);
        
        // Update status
        if (totalTime < 100) {
            status.className = 'status-badge success';
            status.textContent = `Excellent (${Math.round(totalTime)}ms)`;
        } else if (totalTime < 200) {
            status.className = 'status-badge warning';
            status.textContent = `Good (${Math.round(totalTime)}ms)`;
        } else {
            status.className = 'status-badge error';
            status.textContent = `Slow (${Math.round(totalTime)}ms)`;
        }
    }
}

// Initialize tests
const mobileTest = new MobileOptimizationTest();
window.runPerformanceTest = () => mobileTest.runPerformanceTest();

// Detect if running on mobile
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    console.log('Mobile device detected - all tests available');
} else {
    console.log('Desktop device - touch tests may be limited');
    
    // Show warning
    const warning = document.createElement('div');
    warning.style.cssText = `
        background: var(--warning);
        color: #000;
        padding: 1rem;
        text-align: center;
        font-weight: 600;
    `;
    warning.textContent = 'Desktop browser detected - touch features limited';
    document.body.insertBefore(warning, document.body.firstChild);
}