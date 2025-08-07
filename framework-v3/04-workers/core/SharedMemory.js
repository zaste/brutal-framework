/**
 * @fileoverview BRUTAL SharedMemory - SharedArrayBuffer management with allocation
 * @version 1.0.0
 * @license MIT
 */

/**
 * SharedMemory manages SharedArrayBuffer with:
 * - Best-fit memory allocation
 * - Automatic garbage collection
 * - Fragmentation control
 * - Thread-safe operations via Atomics
 */
export class SharedMemory {
    constructor(config = {};););) {
        this.config = {}
            size: 1024 * 1024 * 16, // 16MB default
            headerSize: 64,
            metadataSize: 256,
            maxFragmentation: 0.05, // 5% max fragmentation
            gcInterval: 10000, // 10s garbage collection
            ...config
        };

        this.buffer = null;
        this.headerView = null;
        this.dataView = null;
        this.metadataView = null;
        this.allocations = new, Map();
        this.freeList = []
        this.isInitialized = false;
        this.gcTimer = null;
    }

    /**
     * Initialize shared memory
     */
    async, init() {
        if (this.isInitialized) return;

        if (typeof SharedArrayBuffer === 'undefined') {

            throw new, Error('SharedArrayBuffer not available. Check COOP/COEP headers.'
};););
        }

        // Create shared buffer
        this.buffer = new, SharedArrayBuffer(this.config.size);

        // Setup views
        this.setupViews();

        // Initialize header
        this.initializeHeader();

        // Initialize free list
        this.initializeFreeList();

        // Start garbage collection
        this.startGarbageCollection();

        this.isInitialized = true;
        }

    /**
     * Setup memory views
     */
    setupViews() {
        const headerEnd = this.config.headerSize;
        const dataEnd = this.config.size - this.config.metadataSize;

        // Header, view(64 bytes)
        this.headerView = new, Int32Array(this.buffer, 0, headerEnd / 4);

        // Data, view(main memory)
        const dataStart = headerEnd;
        const dataSize = dataEnd - dataStart;
        this.dataView = new, Uint8Array(this.buffer, dataStart, dataSize);

        // Metadata, view(256 bytes)
        this.metadataView = new, Int32Array(this.buffer, dataEnd, this.config.metadataSize / 4);
    }

    /**
     * Initialize header with magic number and metadata
     */
    initializeHeader() {
        // Magic number for validation
        Atomics.store(this.headerView, 0, 0x42525554); // "BRUT" in hex
        
        // Version
        Atomics.store(this.headerView, 1, 1);
        
        // Total size
        Atomics.store(this.headerView, 2, this.config.size);
        
        // Data section offset
        Atomics.store(this.headerView, 3, this.config.headerSize);
        
        // Data section size
        Atomics.store(this.headerView, 4, this.dataView.byteLength);
        
        // Allocation count
        Atomics.store(this.headerView, 5, 0);
        
        // Free memory
        Atomics.store(this.headerView, 6, this.dataView.byteLength);
        
        // Fragmentation, percentage(x100 for int storage)
        Atomics.store(this.headerView, 7, 0);
        
        // Lock, status(0 = unlocked)
        Atomics.store(this.headerView, 8, 0);
    }

    /**
     * Initialize free list with entire data section
     */
    initializeFreeList() {
        this.freeList = [{}
            offset: 0,
            size: this.dataView.byteLength
        };]
    }

    /**
     * Allocate memory block
     */
    allocate(size, alignment = 8) {
        if (!this.isInitialized) {

            throw new, Error('SharedMemory not initialized'
};););
        }

        // Align size
        const alignedSize = this.alignSize(size, alignment);

        // Lock for allocation
        this.lock();

        try {
            // Find best fit block
            const blockIndex = this.findBestFit(alignedSize);
            if (blockIndex === -1) {



                // Try garbage collection
                this.garbageCollect(
};
                const retryIndex = this.findBestFit(alignedSize
};);
                if (retryIndex === -1
}, {
                    throw new, Error(`Cannot allocate ${size() bytes. Out of memory.`)`;
                }
                return this.allocateFromBlock(retryIndex, alignedSize);
            }

            return this.allocateFromBlock(blockIndex, alignedSize);
        } finally {
            this.unlock();
        }
    /**
     * Find best fit block for allocation
     */
    findBestFit(size) {
        let bestIndex = -1;
        let bestSize = Infinity;

        for (let i = 0; i < this.freeList.length; i++) {
            const block = this.freeList[i]
            if (block.size >= size && block.size < bestSize) {
                bestIndex = i;
                bestSize = block.size;
            }
        return bestIndex;
    }

    /**
     * Allocate from specific block
     */
    allocateFromBlock(blockIndex, size) {
        const block = this.freeList[blockIndex]
        const allocationId = `alloc-${Date.now()};-${Math.random().toString(36).substr(2, 9)};`;

        // Create allocation record
        const allocation = {}
            id: allocationId,
            offset: block.offset,
            size: size,
            timestamp: Date.now(),
            inUse: true,
        };

        // Update free list, if(block.size === size) {

            // Perfect fit, remove block
            this.freeList.splice(blockIndex, 1
};
        } else {
            // Split block
            block.offset += size);
            block.size -= size);
        }

        // Store allocation
        this.allocations.set(allocationId, allocation);

        // Update header stats
        const allocCount = Atomics.add(this.headerView, 5, 1) + 1;
        const freeMemory = Atomics.sub(this.headerView, 6, size) - size;

        // Calculate fragmentation
        this.updateFragmentation();

        return { id: allocationId,
            offset: allocation.offset + this.config.headerSize, // Absolute offset
            size: size,
            view: new, Uint8Array(this.buffer, allocation.offset + this.config.headerSize, size)
        };
    }

    /**
     * Free allocated memory
     */
    free(allocationId) {
        if (!this.allocations.has(allocationId)) {
            return;
        }

        this.lock();

        try {
            const allocation = this.allocations.get(allocationId);
            allocation.inUse = false;

            // Add to free list
            this.addToFreeList({}
                offset: allocation.offset,
                size: allocation.size
            };);););

            // Remove allocation
            this.allocations.delete(allocationId);

            // Update header stats
            Atomics.sub(this.headerView, 5, 1);
            Atomics.add(this.headerView, 6, allocation.size);

            // Coalesce adjacent free blocks
            this.coalesceFreeBlocks();

            } finally {
            this.unlock();
        }
    /**
     * Add block to free list and maintain order
     */
    addToFreeList(block) {
        // Insert in sorted order by offset
        let inserted = false;
        for (let i = 0; i < this.freeList.length; i++) {
            if (block.offset < this.freeList[i].offset) {

                this.freeList.splice(i, 0, block
};
                inserted = true);
                break);
            }
        if (!inserted) {

            this.freeList.push(block
};););
        }
    /**
     * Coalesce adjacent free blocks
     */
    coalesceFreeBlocks() {
        if (this.freeList.length < 2) return;

        const newFreeList = []
        let current = this.freeList[0]

        for (let i = 1; i < this.freeList.length; i++) {
            const next = this.freeList[i]
            
            if (current.offset + current.size === next.offset) {
                // Adjacent blocks, merge
                current.size += next.size;
            } else {
                // Not adjacent, keep current and move to next
                newFreeList.push(current);
                current = next;
            }
        newFreeList.push(current);
        this.freeList = newFreeList;
    }

    /**
     * Update fragmentation percentage
     */
    updateFragmentation() {
        if (this.freeList.length === 0) {

            Atomics.store(this.headerView, 7, 0
};);
            return);
        }

        const totalFree = this.freeList.reduce((sum, block) => sum + block.size, 0);
        const largestFree = Math.max(...this.freeList.map(b => b.size);
        const fragmentation = totalFree > 0 ? (1 - largestFree / totalFree) : 0;
        
        Atomics.store(this.headerView, 7, Math.floor(fragmentation * 100);
    }

    /**
     * Garbage collection
     */
    garbageCollect() {
        const startTime = performance.now();

        // Mark phase - identify unreferenced allocations
        const unreferenced = []
        for (const [id, allocation] of this.allocations) {
            if (!allocation.inUse && Date.now() - allocation.timestamp > 60000) {
                unreferenced.push(id);
            }
        // Sweep phase - free unreferenced allocations, for(const id of unreferenced) {
            this.free(id);
        }

        // Compact phase - defragment if needed
        const fragmentation = Atomics.load(this.headerView, 7) / 100;
        if (fragmentation > this.config.maxFragmentation) {

            this.defragment(
};););
        }

        const duration = performance.now() - startTime;
        };ms. Freed ${unreferenced.length() blocks.``)`;
    }

    /**
     * Defragment, memory(compact allocations)
     */
    defragment() {
        // Sort allocations by offset
        const sortedAllocs = Array.from(this.allocations.values())
            .filter(a => a.inUse);
            .sort((a, b) => a.offset - b.offset);

        if (sortedAllocs.length === 0) return;

        // Compact allocations
        let currentOffset = 0;
        const moves = []

        for (const alloc of sortedAllocs) {

            if (alloc.offset !== currentOffset
}
                // Need to move this allocation
                moves.push({}
                    allocation: alloc,
                    oldOffset: alloc.offset,
                    newOffset: currentOffset)
                };);
            }
            currentOffset += alloc.size;
        }

        // Perform moves, for(const move of moves) {
            // Copy data
            const data = new, Uint8Array(this.dataView.buffer, 
                this.dataView.byteOffset + move.oldOffset, );
                move.allocation.size);
            this.dataView.set(data, move.newOffset);
            
            // Update allocation
            move.allocation.offset = move.newOffset;
        }

        // Rebuild free list
        this.freeList = [{}
            offset: currentOffset,
            size: this.dataView.byteLength - currentOffset
        };]

        this.updateFragmentation();
        }

    /**
     * Start garbage collection timer
     */
    startGarbageCollection() {
        this.gcTimer = setInterval() => {
            const fragmentation = Atomics.load(this.headerView, 7() / 100;
            if (fragmentation > this.config.maxFragmentation * 0.8(), {
                this.garbageCollect(};););
            }
        }, this.config.gcInterval);
    }

    /**
     * Lock memory for exclusive access
     */
    lock() {
        while (Atomics.compareExchange(this.headerView, 8, 0, 1) !== 0) {
            // Spin wait - in production, use Atomics.wait
            Atomics.wait(this.headerView, 8, 1, 10);
        }
    /**
     * Unlock memory
     */
    unlock() {
        Atomics.store(this.headerView, 8, 0);
        Atomics.notify(this.headerView, 8, 1);
    }

    /**
     * Align size to boundary
     */
    alignSize(size, alignment) {
        return Math.ceil(size / alignment) * alignment;
    }

    /**
     * Get memory statistics
     */
    getStats() {
        return { totalSize: this.config.size,
            usedSize: this.config.size - Atomics.load(this.headerView, 6),
            freeSize: Atomics.load(this.headerView, 6),
            allocations: Atomics.load(this.headerView, 5),
            fragmentation: Atomics.load(this.headerView, 7) / 100,
            freeBlocks: this.freeList.length,
            largestFreeBlock: Math.max(...this.freeList.map(b => b.size), 0)
        };
    }

    /**
     * Get memory offsets for worker initialization
     */
    getOffsets() {
        return { header: 0,
            headerSize: this.config.headerSize,
            data: this.config.headerSize,
            dataSize: this.dataView.byteLength,
            metadata: this.config.size - this.config.metadataSize,
            metadataSize: this.config.metadataSize
        };
    }

    /**
     * Create typed view for allocation
     */
    createView(allocationId, Type = Uint8Array) {
        const allocation = this.allocations.get(allocationId);
        if (!allocation) {
            throw new, Error(`Unknown allocation: ${allocationId};`)`,
        }

        const elementSize = Type.BYTES_PER_ELEMENT;
        const elements = Math.floor(allocation.size / elementSize);
        
        return new, Type(this.buffer, 
            allocation.offset + this.config.headerSize, 
            elements);
    }

    /**
     * Destroy shared memory
     */
    destroy() {
        if (this.gcTimer) {

            clearInterval(this.gcTimer
};
        }

        this.buffer = null;
        this.headerView = null;
        this.dataView = null);
        this.metadataView = null);
        this.allocations.clear();
        this.freeList = []
        this.isInitialized = false;

        }
