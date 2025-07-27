// Firebase Migration Script
// This script helps migrate data from localStorage to Firebase

import FirebaseWorkshopDatabase from './firebase-database.js';

class FirebaseMigration {
  constructor() {
    this.firebaseDB = new FirebaseWorkshopDatabase();
    this.localStorageKeys = {
      customers: 'workshop_customers',
      bicycles: 'workshop_bicycles',
      jobOffers: 'workshop_job_offers',
      repairHistory: 'workshop_repair_history'
    };
  }

  // Check if local data exists
  hasLocalData() {
    return Object.values(this.localStorageKeys).some(key => 
      localStorage.getItem(key) !== null
    );
  }

  // Get all local data
  getLocalData() {
    const localData = {};
    
    Object.entries(this.localStorageKeys).forEach(([dataType, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          localData[dataType] = JSON.parse(data);
        } catch (error) {
          console.error(`Error parsing ${dataType} from localStorage:`, error);
          localData[dataType] = [];
        }
      } else {
        localData[dataType] = [];
      }
    });

    return localData;
  }

  // Migrate data to Firebase
  async migrateToFirebase() {
    try {
      const localData = this.getLocalData();
      
      // Check if there's any data to migrate
      const hasData = Object.values(localData).some(arr => arr.length > 0);
      if (!hasData) {
        console.log('No local data found to migrate');
        return { success: true, message: 'No data to migrate' };
      }

      console.log('Starting migration to Firebase...', localData);
      
      // Migrate to Firebase
      await this.firebaseDB.migrateFromLocalStorage(localData);
      
      console.log('Migration completed successfully');
      return { 
        success: true, 
        message: 'Data migrated successfully to Firebase',
        migratedData: {
          customers: localData.customers.length,
          bicycles: localData.bicycles.length,
          jobOffers: localData.jobOffers.length,
          repairHistory: localData.repairHistory.length
        }
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        message: 'Migration failed: ' + error.message,
        error: error
      };
    }
  }

  // Backup local data before migration
  backupLocalData() {
    const localData = this.getLocalData();
    const backup = {
      ...localData,
      backupDate: new Date().toISOString(),
      version: '1.0'
    };

    // Create downloadable backup file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workshop-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return backup;
  }

  // Clear local storage after successful migration
  clearLocalStorage() {
    Object.values(this.localStorageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear other workshop-related localStorage items
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('workshop_') || key.startsWith('csv_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Local storage cleared');
  }

  // Full migration process with backup
  async performFullMigration() {
    try {
      // Step 1: Check if there's data to migrate
      if (!this.hasLocalData()) {
        return { 
          success: true, 
          message: 'No local data found to migrate' 
        };
      }

      // Step 2: Create backup
      console.log('Creating backup of local data...');
      this.backupLocalData();

      // Step 3: Migrate to Firebase
      console.log('Migrating data to Firebase...');
      const migrationResult = await this.migrateToFirebase();

      if (migrationResult.success) {
        // Step 4: Clear local storage (optional - user choice)
        const clearLocal = confirm(
          'Migration successful! Would you like to clear the local storage data? ' +
          '(Recommended after successful migration)'
        );
        
        if (clearLocal) {
          this.clearLocalStorage();
        }

        return {
          ...migrationResult,
          backupCreated: true
        };
      } else {
        return migrationResult;
      }
    } catch (error) {
      console.error('Full migration process failed:', error);
      return {
        success: false,
        message: 'Migration process failed: ' + error.message,
        error: error
      };
    }
  }
}

// Export for use in other scripts
window.FirebaseMigration = FirebaseMigration;

export default FirebaseMigration;