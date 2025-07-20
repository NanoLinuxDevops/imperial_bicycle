// Local Database Setup using IndexedDB (Browser Database)

class LocalWorkshopDB {
    constructor() {
        this.dbName = 'WorkshopDatabase';
        this.version = 1;
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create customers table
                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
                    customerStore.createIndex('phoneNumber', 'phoneNumber', { unique: true });
                    customerStore.createIndex('name', 'name', { unique: false });
                }

                // Create bicycles table
                if (!db.objectStoreNames.contains('bicycles')) {
                    const bicycleStore = db.createObjectStore('bicycles', { keyPath: 'id' });
                    bicycleStore.createIndex('customerId', 'customerId', { unique: false });
                    bicycleStore.createIndex('brand', 'brand', { unique: false });
                }

                // Create job offers table
                if (!db.objectStoreNames.contains('jobOffers')) {
                    const jobStore = db.createObjectStore('jobOffers', { keyPath: 'id' });
                    jobStore.createIndex('customerId', 'customerId', { unique: false });
                    jobStore.createIndex('bicycleId', 'bicycleId', { unique: false });
                    jobStore.createIndex('status', 'status', { unique: false });
                }

                // Create repair history table
                if (!db.objectStoreNames.contains('repairHistory')) {
                    const repairStore = db.createObjectStore('repairHistory', { keyPath: 'id' });
                    repairStore.createIndex('customerId', 'customerId', { unique: false });
                    repairStore.createIndex('bicycleId', 'bicycleId', { unique: false });
                }
            };
        });
    }

    // Generic method to add data
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic method to get data by ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic method to get all data
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic method to update data
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic method to delete data
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search customers by name or phone
    async searchCustomers(query) {
        const customers = await this.getAll('customers');
        const searchTerm = query.toLowerCase();
        return customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phoneNumber.includes(searchTerm)
        );
    }

    // Get customer with their bicycles and history
    async getCustomerProfile(customerId) {
        const customer = await this.get('customers', customerId);
        if (!customer) return null;

        const bicycles = await this.getBicyclesByCustomer(customerId);
        const jobOffers = await this.getJobOffersByCustomer(customerId);
        const repairHistory = await this.getRepairHistoryByCustomer(customerId);

        return {
            customer,
            bicycles,
            jobOffers,
            repairHistory
        };
    }

    // Get bicycles by customer ID
    async getBicyclesByCustomer(customerId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['bicycles'], 'readonly');
            const store = transaction.objectStore('bicycles');
            const index = store.index('customerId');
            const request = index.getAll(customerId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get job offers by customer ID
    async getJobOffersByCustomer(customerId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['jobOffers'], 'readonly');
            const store = transaction.objectStore('jobOffers');
            const index = store.index('customerId');
            const request = index.getAll(customerId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get repair history by customer ID
    async getRepairHistoryByCustomer(customerId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['repairHistory'], 'readonly');
            const store = transaction.objectStore('repairHistory');
            const index = store.index('customerId');
            const request = index.getAll(customerId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Export all data to CSV files
    async exportToCSV() {
        const customers = await this.getAll('customers');
        const bicycles = await this.getAll('bicycles');
        const jobOffers = await this.getAll('jobOffers');
        const repairHistory = await this.getAll('repairHistory');

        // Export customers
        const customersCSV = this.convertToCSV(customers, ['id', 'name', 'phoneNumber', 'email', 'address', 'totalVisits', 'totalSpent', 'createdAt']);
        this.downloadCSV('customers.csv', customersCSV);

        // Export bicycles with customer info
        const bicyclesWithCustomer = await Promise.all(bicycles.map(async bike => {
            const customer = await this.get('customers', bike.customerId);
            return {
                ...bike,
                customerName: customer ? customer.name : 'Unknown',
                customerPhone: customer ? customer.phoneNumber : 'N/A'
            };
        }));
        const bicyclesCSV = this.convertToCSV(bicyclesWithCustomer, ['id', 'customerName', 'customerPhone', 'brand', 'model', 'color', 'type', 'additionalSpecs', 'totalRepairs', 'registeredAt', 'lastServiceDate']);
        this.downloadCSV('bicycles.csv', bicyclesCSV);

        // Export job offers with details
        const jobOffersWithDetails = await Promise.all(jobOffers.map(async job => {
            const customer = await this.get('customers', job.customerId);
            const bicycle = await this.get('bicycles', job.bicycleId);
            const repairsList = job.repairs.map(r => `${r.description} (₪${r.price})`).join('; ');
            
            return {
                id: job.id,
                customerName: customer ? customer.name : 'Unknown',
                customerPhone: customer ? customer.phoneNumber : 'N/A',
                bicycleBrand: bicycle ? bicycle.brand : 'Unknown',
                bicycleColor: bicycle ? bicycle.color : 'Unknown',
                repairs: repairsList,
                totalAmount: job.totalAmount,
                status: job.status,
                notes: job.notes || '',
                createdAt: job.createdAt,
                completedAt: job.completedAt || ''
            };
        }));
        const jobOffersCSV = this.convertToCSV(jobOffersWithDetails, ['id', 'customerName', 'customerPhone', 'bicycleBrand', 'bicycleColor', 'repairs', 'totalAmount', 'status', 'notes', 'createdAt', 'completedAt']);
        this.downloadCSV('job_offers.csv', jobOffersCSV);

        showNotification('All data exported to CSV files!', 'success');
    }

    // Convert data to CSV format
    convertToCSV(data, headers) {
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] || '';
                return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    }

    // Download CSV file
    downloadCSV(filename, csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Clear all data
    async clearAll() {
        const stores = ['customers', 'bicycles', 'jobOffers', 'repairHistory'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

// Initialize local database
let localDB = null;

// Initialize the local database when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        localDB = new LocalWorkshopDB();
        await localDB.init();
        console.log('Local IndexedDB database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize local database:', error);
    }
});