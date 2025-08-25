export default class ConfigQueue {
  #queue = [];
  #isProcessing = false;
  #timer = null;
  #storageKey;
  #saveCallback;
  #processDelay;

  constructor(storageKey, saveCallback, processDelay = 500) {
    this.#storageKey = storageKey;
    this.#saveCallback = saveCallback;
    this.#processDelay = processDelay;
  }

  /**
   * Add an update to the queue
   * @param {Object} data - The data to queue for saving
   */
  add(data) {
    this.#queue.push({
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now()
    });
    
    this.#saveToStorage();
    this.#scheduleProcessing();
  }

  /**
   * Schedule queue processing with debouncing
   */
  #scheduleProcessing() {
    if (this.#timer) {
      clearTimeout(this.#timer);
    }
    
    this.#timer = setTimeout(() => {
      this.process();
    }, this.#processDelay);
  }

  /**
   * Process the queue and save the latest update
   */
  async process() {
    if (this.#isProcessing || this.#queue.length === 0) {
      return { success: true, processed: 0 };
    }
    
    this.#isProcessing = true;
    
    try {
      // Get the latest update (most recent)
      const latestUpdate = this.#queue[this.#queue.length - 1];
      const processedCount = this.#queue.length;
      
      // Call the save callback
      await this.#saveCallback(latestUpdate.data);
      
      // Clear the queue after successful save
      this.clear();
      
      console.log(`[BUI:ConfigQueue] Processed ${processedCount} updates`);
      
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error('[BUI:ConfigQueue] Failed to process queue:', error);
      return { success: false, error: error.message };
    } finally {
      this.#isProcessing = false;
    }
  }

  /**
   * Clear the queue and remove from storage
   */
  clear() {
    this.#queue = [];
    this.#clearStorage();
    
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * Restore queue from localStorage
   * @returns {number} Number of items restored
   */
  restore() {
    try {
      const storedData = localStorage.getItem(this.#storageKey);
      if (storedData) {
        const restoredQueue = JSON.parse(storedData);
        if (Array.isArray(restoredQueue)) {
          this.#queue = restoredQueue;
          console.log(`[BUI:ConfigQueue] Restored ${this.#queue.length} queued updates`);
          
          // Schedule processing of restored items
          if (this.#queue.length > 0) {
            setTimeout(() => this.process(), 1000);
          }
          
          return this.#queue.length;
        }
      }
    } catch (error) {
      console.warn('[BUI:ConfigQueue] Failed to restore queue:', error);
      this.#queue = [];
    }
    
    return 0;
  }

  /**
   * Save queue to localStorage
   */
  #saveToStorage() {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(this.#queue));
    } catch (error) {
      console.warn('[BUI:ConfigQueue] Failed to save queue to localStorage:', error);
    }
  }

  /**
   * Remove queue from localStorage
   */
  #clearStorage() {
    try {
      localStorage.removeItem(this.#storageKey);
    } catch (error) {
      console.warn('[BUI:ConfigQueue] Failed to clear queue from localStorage:', error);
    }
  }

  /**
   * Get queue status information
   * @returns {Object} Queue status
   */
  getStatus() {
    return {
      queueLength: this.#queue.length,
      isProcessing: this.#isProcessing,
      hasTimer: this.#timer !== null,
      oldestItem: this.#queue.length > 0 ? this.#queue[0].timestamp : null,
      newestItem: this.#queue.length > 0 ? this.#queue[this.#queue.length - 1].timestamp : null
    };
  }

  /**
   * Force immediate processing of the queue
   * @returns {Promise} Processing result
   */
  async forceProcess() {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    
    return await this.process();
  }

  /**
   * Get the number of items in queue
   * @returns {number} Queue length
   */
  get length() {
    return this.#queue.length;
  }

  /**
   * Check if queue is empty
   * @returns {boolean} True if queue is empty
   */
  get isEmpty() {
    return this.#queue.length === 0;
  }

  /**
   * Check if queue is currently processing
   * @returns {boolean} True if processing
   */
  get isProcessing() {
    return this.#isProcessing;
  }
}