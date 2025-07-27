// Firebase Database Management for Workshop System
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase-config.js';

class FirebaseWorkshopDatabase {
  constructor() {
    this.collections = {
      customers: 'customers',
      bicycles: 'bicycles',
      jobOffers: 'jobOffers',
      repairHistory: 'repairHistory',
      repairServices: 'repairServices'
    };
  }

  // Customer Management
  async addCustomer(customerData) {
    try {
      // Check if customer already exists by phone number
      const existingCustomer = await this.getCustomerByPhone(customerData.phoneNumber);
      if (existingCustomer) {
        return existingCustomer;
      }

      const customer = {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        email: customerData.email || '',
        address: customerData.address || '',
        totalVisits: 0,
        totalSpent: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collections.customers), customer);
      return { id: docRef.id, ...customer };
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  async getCustomerByPhone(phoneNumber) {
    try {
      const q = query(
        collection(db, this.collections.customers),
        where('phoneNumber', '==', phoneNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting customer by phone:', error);
      throw error;
    }
  }

  async getAllCustomers() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collections.customers));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  async updateCustomer(customerId, updateData) {
    try {
      const customerRef = doc(db, this.collections.customers, customerId);
      await updateDoc(customerRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async searchCustomers(searchTerm) {
    try {
      const customers = await this.getAllCustomers();
      const searchLower = searchTerm.toLowerCase();
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phoneNumber.includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Bicycle Management
  async addBicycle(bicycleData, customerId) {
    try {
      const bicycle = {
        customerId: customerId,
        brand: bicycleData.brand,
        model: bicycleData.model || '',
        color: bicycleData.color,
        type: bicycleData.type,
        additionalSpecs: bicycleData.additionalSpecs || '',
        totalRepairs: 0,
        lastServiceDate: null,
        registeredAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collections.bicycles), bicycle);
      return { id: docRef.id, ...bicycle };
    } catch (error) {
      console.error('Error adding bicycle:', error);
      throw error;
    }
  }

  async getBicyclesByCustomer(customerId) {
    try {
      const q = query(
        collection(db, this.collections.bicycles),
        where('customerId', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting bicycles by customer:', error);
      throw error;
    }
  }

  async getAllBicycles() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collections.bicycles));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting bicycles:', error);
      throw error;
    }
  }

  async deleteBicycle(bicycleId) {
    try {
      const batch = writeBatch(db);

      // Delete the bicycle
      const bicycleRef = doc(db, this.collections.bicycles, bicycleId);
      batch.delete(bicycleRef);

      // Delete related job offers
      const jobOffersQuery = query(
        collection(db, this.collections.jobOffers),
        where('bicycleId', '==', bicycleId)
      );
      const jobOffersSnapshot = await getDocs(jobOffersQuery);
      jobOffersSnapshot.docs.forEach(jobDoc => {
        batch.delete(jobDoc.ref);
      });

      // Delete related repair history
      const repairHistoryQuery = query(
        collection(db, this.collections.repairHistory),
        where('bicycleId', '==', bicycleId)
      );
      const repairHistorySnapshot = await getDocs(repairHistoryQuery);
      repairHistorySnapshot.docs.forEach(repairDoc => {
        batch.delete(repairDoc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting bicycle:', error);
      throw error;
    }
  }

  // Job Offer Management
  async addJobOffer(jobData) {
    try {
      const customer = await this.getCustomer(jobData.customerId);
      const ticketId = await this.generateTicketId(customer);

      const jobOffer = {
        ticketId: ticketId,
        customerId: jobData.customerId,
        bicycleId: jobData.bicycleId,
        repairs: jobData.repairs,
        totalAmount: jobData.totalAmount,
        notes: jobData.notes || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        completedAt: null
      };

      const docRef = await addDoc(collection(db, this.collections.jobOffers), jobOffer);
      return { id: docRef.id, ...jobOffer };
    } catch (error) {
      console.error('Error adding job offer:', error);
      throw error;
    }
  }

  async getCustomer(customerId) {
    try {
      const customerDoc = await getDoc(doc(db, this.collections.customers, customerId));
      if (customerDoc.exists()) {
        return { id: customerDoc.id, ...customerDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  async generateTicketId(customer) {
    if (!customer) return 'UNKNOWN-' + Date.now();

    // Get customer initials
    const nameWords = customer.name.trim().split(' ');
    const initials = nameWords.map(word => word.charAt(0).toUpperCase()).join('');

    // Get last 4 digits of phone number
    const phoneDigits = customer.phoneNumber.replace(/\D/g, '').slice(-4);

    // Get current date in YYMMDD format
    const now = new Date();
    const dateStr = now.getFullYear().toString().slice(-2) +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    // Count existing tickets for this customer today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, this.collections.jobOffers),
      where('customerId', '==', customer.id),
      where('createdAt', '>=', todayStart),
      where('createdAt', '<', todayEnd)
    );

    const querySnapshot = await getDocs(q);
    const sequenceNumber = (querySnapshot.size + 1).toString().padStart(2, '0');

    return `${initials}-${phoneDigits}-${dateStr}-${sequenceNumber}`;
  }

  async getAllJobOffers() {
    try {
      const q = query(
        collection(db, this.collections.jobOffers),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting job offers:', error);
      throw error;
    }
  }

  async completeJob(jobOfferId) {
    try {
      const batch = writeBatch(db);

      // Get the job offer
      const jobOfferDoc = await getDoc(doc(db, this.collections.jobOffers, jobOfferId));
      if (!jobOfferDoc.exists()) {
        throw new Error('Job offer not found');
      }

      const jobOffer = { id: jobOfferDoc.id, ...jobOfferDoc.data() };

      // Update job offer status
      const jobOfferRef = doc(db, this.collections.jobOffers, jobOfferId);
      batch.update(jobOfferRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Add to repair history
      const repairRecord = {
        customerId: jobOffer.customerId,
        bicycleId: jobOffer.bicycleId,
        jobOfferId: jobOfferId,
        repairs: jobOffer.repairs,
        totalAmount: jobOffer.totalAmount,
        notes: jobOffer.notes,
        completedAt: serverTimestamp()
      };

      const repairHistoryRef = collection(db, this.collections.repairHistory);
      const repairDocRef = doc(repairHistoryRef);
      batch.set(repairDocRef, repairRecord);

      // Update customer stats
      const customerRef = doc(db, this.collections.customers, jobOffer.customerId);
      const customerDoc = await getDoc(customerRef);
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        batch.update(customerRef, {
          totalVisits: (customerData.totalVisits || 0) + 1,
          totalSpent: (customerData.totalSpent || 0) + jobOffer.totalAmount
        });
      }

      // Update bicycle stats
      const bicycleRef = doc(db, this.collections.bicycles, jobOffer.bicycleId);
      const bicycleDoc = await getDoc(bicycleRef);
      if (bicycleDoc.exists()) {
        const bicycleData = bicycleDoc.data();
        batch.update(bicycleRef, {
          totalRepairs: (bicycleData.totalRepairs || 0) + 1,
          lastServiceDate: serverTimestamp()
        });
      }

      await batch.commit();
      return { id: repairDocRef.id, ...repairRecord };
    } catch (error) {
      console.error('Error completing job:', error);
      throw error;
    }
  }

  async deleteJobOffer(jobOfferId) {
    try {
      await deleteDoc(doc(db, this.collections.jobOffers, jobOfferId));
      return true;
    } catch (error) {
      console.error('Error deleting job offer:', error);
      throw error;
    }
  }

  // Repair History
  async getRepairHistory() {
    try {
      const q = query(
        collection(db, this.collections.repairHistory),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting repair history:', error);
      throw error;
    }
  }

  // Data Export
  async exportAllData() {
    try {
      const [customers, bicycles, jobOffers, repairHistory] = await Promise.all([
        this.getAllCustomers(),
        this.getAllBicycles(),
        this.getAllJobOffers(),
        this.getRepairHistory()
      ]);

      return {
        customers,
        bicycles,
        jobOffers,
        repairHistory,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Clear all data (use with caution)
  async clearAllData() {
    try {
      const batch = writeBatch(db);
      
      const collections = [
        this.collections.customers,
        this.collections.bicycles,
        this.collections.jobOffers,
        this.collections.repairHistory
      ];

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.docs.forEach(document => {
          batch.delete(document.ref);
        });
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Migration from localStorage to Firebase
  async migrateFromLocalStorage(localData) {
    try {
      const batch = writeBatch(db);

      // Migrate customers
      if (localData.customers) {
        for (const customer of localData.customers) {
          const customerRef = doc(collection(db, this.collections.customers));
          const { id, ...customerData } = customer;
          batch.set(customerRef, {
            ...customerData,
            createdAt: new Date(customerData.createdAt || Date.now())
          });
        }
      }

      // Migrate bicycles
      if (localData.bicycles) {
        for (const bicycle of localData.bicycles) {
          const bicycleRef = doc(collection(db, this.collections.bicycles));
          const { id, ...bicycleData } = bicycle;
          batch.set(bicycleRef, {
            ...bicycleData,
            registeredAt: new Date(bicycleData.registeredAt || Date.now())
          });
        }
      }

      // Migrate job offers
      if (localData.jobOffers) {
        for (const jobOffer of localData.jobOffers) {
          const jobOfferRef = doc(collection(db, this.collections.jobOffers));
          const { id, ...jobOfferData } = jobOffer;
          batch.set(jobOfferRef, {
            ...jobOfferData,
            createdAt: new Date(jobOfferData.createdAt || Date.now()),
            completedAt: jobOfferData.completedAt ? new Date(jobOfferData.completedAt) : null
          });
        }
      }

      // Migrate repair history
      if (localData.repairHistory) {
        for (const repair of localData.repairHistory) {
          const repairRef = doc(collection(db, this.collections.repairHistory));
          const { id, ...repairData } = repair;
          batch.set(repairRef, {
            ...repairData,
            completedAt: new Date(repairData.completedAt || Date.now())
          });
        }
      }

      await batch.commit();
      console.log('Migration completed successfully');
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  }
}

export default FirebaseWorkshopDatabase;