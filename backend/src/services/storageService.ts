import fs from 'fs';
import path from 'path';

// Make sure the storage directory exists
const STORAGE_DIR = path.join(__dirname, '../../storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Service for managing local storage of agent designs
 */
export class StorageService {
  /**
   * Save a new agent design
   * @param name - Name of the agent design
   * @param data - Design data to save
   * @returns The saved design with ID
   */
  async saveDesign(name: string, data: any) {
    try {
      // Generate a unique ID based on timestamp
      const id = `design_${Date.now()}`;
      
      // Create the full design object with metadata
      const design = {
        id,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data
      };
      
      // Write to file
      const filePath = path.join(STORAGE_DIR, `${id}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(design, null, 2));
      
      return design;
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific design by ID
   * @param id - ID of the design to retrieve
   * @returns The design data
   */
  async getDesign(id: string) {
    try {
      const filePath = path.join(STORAGE_DIR, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Design with ID ${id} not found`);
      }
      
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting design:', error);
      throw error;
    }
  }
  
  /**
   * List all saved designs
   * @returns Array of designs with metadata
   */
  async listDesigns() {
    try {
      // Read all JSON files in the storage directory
      const files = await fs.promises.readdir(STORAGE_DIR);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Read and parse each file
      const designs = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(STORAGE_DIR, file);
          const data = await fs.promises.readFile(filePath, 'utf-8');
          return JSON.parse(data);
        })
      );
      
      // Sort by creation date (newest first)
      return designs.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Error listing designs:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing design
   * @param id - ID of the design to update
   * @param updates - New data for the design
   * @returns The updated design
   */
  async updateDesign(id: string, updates: any) {
    try {
      // Get the current design
      const design = await this.getDesign(id);
      
      // Update the design with new data
      const updatedDesign = {
        ...design,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If data property is being updated, replace only that property
      if (updates.data) {
        updatedDesign.data = updates.data;
      }
      
      // Write to file
      const filePath = path.join(STORAGE_DIR, `${id}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(updatedDesign, null, 2));
      
      return updatedDesign;
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }
  
  /**
   * Delete a design
   * @param id - ID of the design to delete
   * @returns Success message
   */
  async deleteDesign(id: string) {
    try {
      const filePath = path.join(STORAGE_DIR, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Design with ID ${id} not found`);
      }
      
      await fs.promises.unlink(filePath);
      
      return { message: `Design ${id} successfully deleted` };
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }
} 