// Workshop Management System - FIXED VERSION
console.log('Loading Workshop Management System...');

// Database Class
class WorkshopDatabase {
    constructor() {
        this.customers = JSON.parse(localStorage.getItem('workshop_customers')) || [];
        this.bicycles = JSON.parse(localStorage.getItem('workshop_bicycles')) || [];
        this.jobOffers = JSON.parse(localStorage.getItem('workshop_job_offers')) || [];
        this.repairHistory = JSON.parse(localStorage.getItem('workshop_repair_history')) || [];
    }

    saveToStorage() {
        localStorage.setItem('workshop_customers', JSON.stringify(this.customers));
        localStorage.setItem('workshop_bicycles', JSON.stringify(this.bicycles));
        localStorage.setItem('workshop_job_offers', JSON.stringify(this.jobOffers));
        localStorage.setItem('workshop_repair_history', JSON.stringify(this.repairHistory));
    }

    addCustomer(customerData) {
        const existingCustomer = this.customers.find(c => c.phoneNumber === customerData.phoneNumber);
        if (existingCustomer) {
            return existingCustomer;
        }
        
        const customer = {
            id: Date.now(),
            name: customerData.name,
            phoneNumber: customerData.phoneNumber,
            email: customerData.email || '',
            address: customerData.address || '',
            createdAt: new Date().toISOString(),
            totalVisits: 0,
            totalSpent: 0
        };
        
        this.customers.push(customer);
        this.saveToStorage();
        return customer;
    }

    addBicycle(bicycleData, customerId) {
        const bicycle = {
            id: Date.now(),
            customerId: customerId,
            brand: bicycleData.brand,
            model: bicycleData.model || '',
            color: bicycleData.color,
            type: bicycleData.type,
            additionalSpecs: bicycleData.additionalSpecs,
            registeredAt: new Date().toISOString(),
            lastServiceDate: null,
            totalRepairs: 0
        };
        
        this.bicycles.push(bicycle);
        this.saveToStorage();
        return bicycle;
    }

    addJobOffer(jobData) {
        const jobOffer = {
            id: Date.now(),
            customerId: jobData.customerId,
            bicycleId: jobData.bicycleId,
            repairs: jobData.repairs,
            totalAmount: jobData.totalAmount,
            notes: jobData.notes,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.jobOffers.push(jobOffer);
        this.saveToStorage();
        return jobOffer;
    }

    completeJob(jobOfferId) {
        const jobOffer = this.jobOffers.find(j => j.id === jobOfferId);
        if (!jobOffer) return null;

        jobOffer.status = 'completed';
        jobOffer.completedAt = new Date().toISOString();

        const repairRecord = {
            id: Date.now(),
            customerId: jobOffer.customerId,
            bicycleId: jobOffer.bicycleId,
            jobOfferId: jobOfferId,
            repairs: jobOffer.repairs,
            totalAmount: jobOffer.totalAmount,
            notes: jobOffer.notes,
            completedAt: jobOffer.completedAt
        };

        this.repairHistory.push(repairRecord);

        const customer = this.customers.find(c => c.id === jobOffer.customerId);
        if (customer) {
            customer.totalVisits += 1;
            customer.totalSpent += jobOffer.totalAmount;
        }

        const bicycle = this.bicycles.find(b => b.id === jobOffer.bicycleId);
        if (bicycle) {
            bicycle.lastServiceDate = jobOffer.completedAt;
            bicycle.totalRepairs += 1;
        }

        this.saveToStorage();
        return repairRecord;
    }

    getCustomerProfile(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return null;

        const customerBicycles = this.bicycles.filter(b => b.customerId === customerId);
        const customerRepairs = this.repairHistory.filter(r => r.customerId === customerId);
        const customerJobOffers = this.jobOffers.filter(j => j.customerId === customerId);

        return {
            customer,
            bicycles: customerBicycles,
            repairs: customerRepairs,
            jobOffers: customerJobOffers
        };
    }

    searchCustomers(query) {
        const searchTerm = query.toLowerCase();
        return this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phoneNumber.includes(searchTerm)
        );
    }

    exportDatabase() {
        return {
            customers: this.customers,
            bicycles: this.bicycles,
            jobOffers: this.jobOffers,
            repairHistory: this.repairHistory,
            exportedAt: new Date().toISOString()
        };
    }

    importDatabase(data) {
        if (data.customers) this.customers = data.customers;
        if (data.bicycles) this.bicycles = data.bicycles;
        if (data.jobOffers) this.jobOffers = data.jobOffers;
        if (data.repairHistory) this.repairHistory = data.repairHistory;
        this.saveToStorage();
    }
}

// Initialize database
const db = new WorkshopDatabase();
let selectedCustomerId = null;

// Repair Services Management
class RepairServicesManager {
    constructor() {
        this.defaultServices = [
            { id: 'brake_adjustment', name: 'Brake Adjustment', defaultPrice: 50 },
            { id: 'gear_tuning', name: 'Gear Tuning', defaultPrice: 40 },
            { id: 'chain_replacement', name: 'Chain Replacement', defaultPrice: 80 },
            { id: 'tire_replacement', name: 'Tire Replacement', defaultPrice: 120 },
            { id: 'brake_pad_replacement', name: 'Brake Pad Replacement', defaultPrice: 60 },
            { id: 'wheel_truing', name: 'Wheel Truing', defaultPrice: 70 },
            { id: 'full_service', name: 'Full Service', defaultPrice: 200 }
        ];
        this.customServices = JSON.parse(localStorage.getItem('workshop_repair_services')) || [];
    }

    getAllServices() {
        return [...this.defaultServices, ...this.customServices];
    }

    addCustomService(serviceName, defaultPrice) {
        const service = {
            id: 'custom_' + Date.now(),
            name: serviceName,
            defaultPrice: parseFloat(defaultPrice) || 0,
            isCustom: true
        };
        
        this.customServices.push(service);
        this.saveToStorage();
        return service;
    }

    removeCustomService(serviceId) {
        this.customServices = this.customServices.filter(service => service.id !== serviceId);
        this.saveToStorage();
    }

    updateCustomService(serviceId, serviceName, defaultPrice) {
        const service = this.customServices.find(s => s.id === serviceId);
        if (service) {
            service.name = serviceName;
            service.defaultPrice = parseFloat(defaultPrice) || 0;
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem('workshop_repair_services', JSON.stringify(this.customServices));
    }

    exportServices() {
        return {
            defaultServices: this.defaultServices,
            customServices: this.customServices
        };
    }

    importServices(data) {
        if (data.customServices) {
            this.customServices = data.customServices;
            this.saveToStorage();
        }
    }
}

// Initialize repair services manager
const repairServices = new RepairServicesManager();

// Tab functionality - WORKING
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    try {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(tabName);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Add active class to the correct tab button
        const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Load content based on tab
        if (tabName === 'jobs') {
            loadBicycleList();
        } else if (tabName === 'history') {
            loadHistory();
        } else if (tabName === 'database') {
            loadDatabaseStats();
        }
        
        console.log('Tab switched successfully to:', tabName);
    } catch (error) {
        console.error('Error switching tabs:', error);
    }
}

// Customer Selection Functions - WORKING
function showNewCustomerForm() {
    console.log('Showing new customer form');
    try {
        document.getElementById('customerSelection').style.display = 'none';
        document.getElementById('newCustomerSection').style.display = 'block';
        document.getElementById('existingCustomerSection').style.display = 'none';
        document.getElementById('selectedCustomerSection').style.display = 'none';
    } catch (error) {
        console.error('Error showing new customer form:', error);
    }
}

function showExistingCustomerSearch() {
    console.log('Showing existing customer search');
    try {
        document.getElementById('customerSelection').style.display = 'none';
        document.getElementById('newCustomerSection').style.display = 'none';
        document.getElementById('existingCustomerSection').style.display = 'block';
        document.getElementById('selectedCustomerSection').style.display = 'none';
        
        document.getElementById('existingCustomerSearch').value = '';
        document.getElementById('existingCustomerResults').innerHTML = '';
    } catch (error) {
        console.error('Error showing existing customer search:', error);
    }
}

function backToCustomerSelection() {
    console.log('Going back to customer selection');
    try {
        document.getElementById('customerSelection').style.display = 'block';
        document.getElementById('newCustomerSection').style.display = 'none';
        document.getElementById('existingCustomerSection').style.display = 'none';
        document.getElementById('selectedCustomerSection').style.display = 'none';
        
        const bicycleForm = document.getElementById('bicycleForm');
        if (bicycleForm) bicycleForm.reset();
        selectedCustomerId = null;
    } catch (error) {
        console.error('Error going back to customer selection:', error);
    }
}

function backToExistingCustomerSearch() {
    console.log('Going back to existing customer search');
    try {
        document.getElementById('existingCustomerSection').style.display = 'block';
        document.getElementById('selectedCustomerSection').style.display = 'none';
        selectedCustomerId = null;
    } catch (error) {
        console.error('Error going back to existing customer search:', error);
    }
}

// Register new bicycle - WORKING
function registerBicycle(event) {
    console.log('Registering bicycle');
    event.preventDefault();
    
    try {
        const customer = db.addCustomer({
            name: document.getElementById('customerName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            email: document.getElementById('customerEmail').value,
            address: document.getElementById('customerAddress').value
        });
        
        const bicycle = db.addBicycle({
            brand: document.getElementById('bikeBrand').value,
            color: document.getElementById('bikeColor').value,
            type: document.querySelector('input[name="bikeType"]:checked').value,
            additionalSpecs: document.getElementById('additionalSpecs').value
        }, customer.id);
        
        event.target.reset();
        alert('New customer and bicycle registered successfully!');
        backToCustomerSelection();
        loadBicycleList();
    } catch (error) {
        console.error('Error registering bicycle:', error);
        alert('Error registering bicycle: ' + error.message);
    }
}

// Load bicycle list - WORKING
function loadBicycleList() {
    console.log('Loading bicycle list');
    try {
        const bicycleList = document.getElementById('bicycleList');
        const emptyState = document.getElementById('emptyJobsState');
        
        if (db.bicycles.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            bicycleList.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        bicycleList.innerHTML = db.bicycles.map(bike => {
            const customer = db.customers.find(c => c.id === bike.customerId);
            return `
                <div class="bicycle-card" onclick="createJobOffer(${bike.id})">
                    <h3>${bike.brand} - ${customer ? customer.name : 'Unknown Customer'}</h3>
                    <div class="bicycle-info">
                        <div class="info-item">
                            <span class="info-label">Phone:</span>
                            <span>${customer ? customer.phoneNumber : 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Registered:</span>
                            <span>${new Date(bike.registeredAt).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Color:</span>
                            <span>${bike.color}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Type:</span>
                            <span>${bike.type}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Repairs:</span>
                            <span>${bike.totalRepairs}</span>
                        </div>
                    </div>
                    ${bike.additionalSpecs ? `<p><strong>Specs:</strong> ${bike.additionalSpecs}</p>` : ''}
                    <p><em>Click to create job offer</em></p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bicycle list:', error);
    }
}

// Back to bicycle list - WORKING
function backToBicycleList() {
    console.log('Going back to bicycle list');
    try {
        const jobsContent = document.getElementById('jobsContent');
        
        jobsContent.innerHTML = `
            <div class="empty-state" id="emptyJobsState" style="display: none;">
                <div class="empty-icon">EMPTY</div>
                <h3>No Bicycles Registered Yet</h3>
                <p>Register a bicycle first to create job offers and repair estimates.</p>
                <button onclick="showTab('register')" class="empty-action-btn">Register First Bicycle</button>
            </div>
            <div id="bicycleList"></div>
        `;
        
        loadBicycleList();
    } catch (error) {
        console.error('Error going back to bicycle list:', error);
    }
}

// Create job offer - WORKING
function createJobOffer(bicycleId) {
    console.log('Creating job offer for bicycle:', bicycleId);
    try {
        const bicycle = db.bicycles.find(b => b.id === bicycleId);
        if (!bicycle) return;
        
        const customer = db.customers.find(c => c.id === bicycle.customerId);
        const jobsContent = document.getElementById('jobsContent');
        
        jobsContent.innerHTML = `
            <div class="job-form">
                <button type="button" onclick="backToBicycleList()" class="back-btn" style="margin-bottom: 20px;">
                    ← BACK TO BICYCLE LIST
                </button>
                
                <h3>Job Offer for ${bicycle.brand} - ${customer ? customer.name : 'Unknown Customer'}</h3>
                <div class="bicycle-info">
                    <div class="info-item">
                        <span class="info-label">Phone:</span>
                        <span>${customer ? customer.phoneNumber : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Registered:</span>
                        <span>${new Date(bicycle.registeredAt).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Bike:</span>
                        <span>${bicycle.brand} (${bicycle.color})</span>
                    </div>
                </div>
                
                <div class="repairs-header">
                    <h4>Repairs & Services</h4>
                    <button type="button" onclick="showRepairServicesManager()" class="back-btn" style="margin-left: auto; margin-bottom: 0;">
                        MANAGE SERVICES
                    </button>
                </div>
                
                <form id="jobOfferForm" onsubmit="saveJobOffer(event, ${bicycleId})">
                    <div id="repairItems">
                        ${generateRepairServicesList()}
                    </div>
                    
                    <div class="repair-actions">
                        <button type="button" onclick="addTemporaryRepair()">+ Add Temporary Repair</button>
                        <button type="button" onclick="showAddPermanentServiceForm()">+ Add Permanent Service</button>
                    </div>
                    
                    <div class="total-section">
                        <div class="total-amount">
                            Total: ₪<span id="totalAmount">0.00</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="jobNotes">Additional Notes:</label>
                        <textarea id="jobNotes" rows="3" placeholder="Any additional notes or special instructions..."></textarea>
                    </div>
                    
                    <button type="submit">Create Job Offer</button>
                </form>
            </div>
        `;
        
        // Add event listeners for price calculation
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', calculateTotal);
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculateTotal);
        });
    } catch (error) {
        console.error('Error creating job offer:', error);
    }
}

// Add custom repair - WORKING
function addCustomRepair() {
    console.log('Adding custom repair');
    try {
        const repairItems = document.getElementById('repairItems');
        const customId = 'custom_' + Date.now();
        
        const div = document.createElement('div');
        div.className = 'repair-item';
        div.innerHTML = `
            <input type="checkbox" id="${customId}" name="repairs" value="${customId}">
            <input type="text" placeholder="Repair description" id="desc_${customId}" required>
            <input type="number" placeholder="Price" step="0.01" min="0" id="price_${customId}">
            <button type="button" onclick="this.parentElement.remove(); calculateTotal();">Remove</button>
        `;
        
        repairItems.appendChild(div);
        
        // Add event listeners
        div.querySelector('input[type="number"]').addEventListener('input', calculateTotal);
        div.querySelector('input[type="checkbox"]').addEventListener('change', calculateTotal);
    } catch (error) {
        console.error('Error adding custom repair:', error);
    }
}

// Calculate total - WORKING
function calculateTotal() {
    try {
        let total = 0;
        
        document.querySelectorAll('.repair-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const priceInput = item.querySelector('input[type="number"]');
            
            if (checkbox && checkbox.checked && priceInput && priceInput.value) {
                total += parseFloat(priceInput.value) || 0;
            }
        });
        
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    } catch (error) {
        console.error('Error calculating total:', error);
    }
}

// Save job offer - WORKING
function saveJobOffer(event, bicycleId) {
    console.log('Saving job offer');
    event.preventDefault();
    
    try {
        const bicycle = db.bicycles.find(b => b.id === bicycleId);
        if (!bicycle) return;
        
        const repairs = [];
        
        document.querySelectorAll('.repair-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const priceInput = item.querySelector('input[type="number"]');
            
            if (checkbox && checkbox.checked && priceInput && priceInput.value) {
                let description = checkbox.nextElementSibling.textContent;
                
                // Handle custom repairs
                if (checkbox.value.startsWith('custom_')) {
                    const descInput = item.querySelector('input[type="text"]');
                    description = descInput ? descInput.value : 'Custom Repair';
                }
                
                repairs.push({
                    id: checkbox.value,
                    description: description,
                    price: parseFloat(priceInput.value) || 0
                });
            }
        });
        
        const totalAmount = repairs.reduce((sum, repair) => sum + repair.price, 0);
        
        // Create job offer using database
        const jobOffer = db.addJobOffer({
            customerId: bicycle.customerId,
            bicycleId: bicycleId,
            repairs: repairs,
            totalAmount: totalAmount,
            notes: document.getElementById('jobNotes').value
        });
        
        alert('Job offer created successfully!');
        loadHistory();
        showTab('history');
    } catch (error) {
        console.error('Error saving job offer:', error);
        alert('Error saving job offer: ' + error.message);
    }
}

// Load history - WORKING
function loadHistory() {
    console.log('Loading history');
    try {
        const historyContent = document.getElementById('historyContent');
        
        if (db.jobOffers.length === 0) {
            historyContent.innerHTML = '<p>No job offers created yet.</p>';
            return;
        }
        
        historyContent.innerHTML = db.jobOffers.map(job => {
            const customer = db.customers.find(c => c.id === job.customerId);
            const bicycle = db.bicycles.find(b => b.id === job.bicycleId);
            
            return `
                <div class="bicycle-card">
                    <h3>Job Offer #${job.id}</h3>
                    <div class="bicycle-info">
                        <div class="info-item">
                            <span class="info-label">Customer:</span>
                            <span>${customer ? customer.name : 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone:</span>
                            <span>${customer ? customer.phoneNumber : 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Bike:</span>
                            <span>${bicycle ? bicycle.brand : 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total:</span>
                            <span class="total-amount">₪${job.totalAmount.toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status:</span>
                            <span>${job.status}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Created:</span>
                            <span>${new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <h4>Repairs:</h4>
                    <ul>
                        ${job.repairs.map(repair => `
                            <li>${repair.description} - ₪${repair.price.toFixed(2)}</li>
                        `).join('')}
                    </ul>
                    
                    ${job.notes ? `<p><strong>Notes:</strong> ${job.notes}</p>` : ''}
                    
                    ${job.status === 'pending' ? `
                        <button onclick="completeJob(${job.id})" style="background-color: #28a745; margin-top: 10px;">
                            Mark as Completed
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Complete job - WORKING
function completeJob(jobOfferId) {
    console.log('Completing job:', jobOfferId);
    try {
        const repairRecord = db.completeJob(jobOfferId);
        if (repairRecord) {
            alert('Job completed successfully!');
            loadHistory();
            loadBicycleList();
        }
    } catch (error) {
        console.error('Error completing job:', error);
        alert('Error completing job: ' + error.message);
    }
}

// CSV Export Functions - WORKING
function exportData() {
    console.log('Exporting all CSV files');
    try {
        exportCustomersCSV();
        setTimeout(() => exportBicyclesCSV(), 500);
        setTimeout(() => exportJobOffersCSV(), 1000);
        setTimeout(() => exportRepairHistoryCSV(), 1500);
        alert('All CSV files exported successfully!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}

function exportCustomersCSV() {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Total Visits', 'Total Spent', 'Created Date'];
    const csvContent = [
        headers.join(','),
        ...db.customers.map(customer => [
            customer.id,
            `"${customer.name}"`,
            `"${customer.phoneNumber}"`,
            `"${customer.email}"`,
            `"${customer.address}"`,
            customer.totalVisits,
            customer.totalSpent.toFixed(2),
            `"${new Date(customer.createdAt).toLocaleDateString()}"`
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'customers.csv');
}

function exportBicyclesCSV() {
    const headers = ['ID', 'Customer ID', 'Brand', 'Color', 'Type', 'Specs', 'Total Repairs', 'Last Service', 'Registered Date'];
    const csvContent = [
        headers.join(','),
        ...db.bicycles.map(bike => [
            bike.id,
            bike.customerId,
            `"${bike.brand}"`,
            `"${bike.color}"`,
            `"${bike.type}"`,
            `"${bike.additionalSpecs || ''}"`,
            bike.totalRepairs,
            `"${bike.lastServiceDate ? new Date(bike.lastServiceDate).toLocaleDateString() : 'Never'}"`,
            `"${new Date(bike.registeredAt).toLocaleDateString()}"`
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'bicycles.csv');
}

function exportJobOffersCSV() {
    const headers = ['Job ID', 'Customer Name', 'Phone', 'Bicycle Brand', 'Total Amount', 'Status', 'Repairs', 'Notes', 'Created Date'];
    const csvContent = [
        headers.join(','),
        ...db.jobOffers.map(job => {
            const customer = db.customers.find(c => c.id === job.customerId);
            const bicycle = db.bicycles.find(b => b.id === job.bicycleId);
            const repairsText = job.repairs.map(r => `${r.description} (₪${r.price})`).join('; ');
            return [
                job.id,
                `"${customer ? customer.name : 'Unknown'}"`,
                `"${customer ? customer.phoneNumber : 'N/A'}"`,
                `"${bicycle ? bicycle.brand : 'Unknown'}"`,
                job.totalAmount.toFixed(2),
                `"${job.status}"`,
                `"${repairsText}"`,
                `"${job.notes || ''}"`,
                `"${new Date(job.createdAt).toLocaleDateString()}"`
            ].join(',');
        })
    ].join('\n');
    
    downloadCSV(csvContent, 'job_offers.csv');
}

function exportRepairHistoryCSV() {
    const headers = ['Repair ID', 'Customer Name', 'Phone', 'Bicycle Brand', 'Total Amount', 'Repairs', 'Completed Date'];
    const csvContent = [
        headers.join(','),
        ...db.repairHistory.map(repair => {
            const customer = db.customers.find(c => c.id === repair.customerId);
            const bicycle = db.bicycles.find(b => b.id === repair.bicycleId);
            const repairsText = repair.repairs.map(r => `${r.description} (₪${r.price})`).join('; ');
            return [
                repair.id,
                `"${customer ? customer.name : 'Unknown'}"`,
                `"${customer ? customer.phoneNumber : 'N/A'}"`,
                `"${bicycle ? bicycle.brand : 'Unknown'}"`,
                repair.totalAmount.toFixed(2),
                `"${repairsText}"`,
                `"${new Date(repair.completedAt).toLocaleDateString()}"`
            ].join(',');
        })
    ].join('\n');
    
    downloadCSV(csvContent, 'repair_history.csv');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Database management functions - WORKING
function importData(event) {
    console.log('Importing data');
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                db.importDatabase(data);
                alert('Data imported successfully!');
                loadBicycleList();
                loadHistory();
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data: ' + error.message);
    }
}

function loadDatabaseStats() {
    console.log('Loading database stats');
    try {
        const customerStats = document.getElementById('customerStats');
        
        const totalCustomers = db.customers.length;
        const totalBicycles = db.bicycles.length;
        const totalJobOffers = db.jobOffers.length;
        const completedJobs = db.jobOffers.filter(j => j.status === 'completed').length;
        const totalRevenue = db.repairHistory.reduce((sum, repair) => sum + repair.totalAmount, 0);
        
        customerStats.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${totalCustomers}</span>
                <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${totalBicycles}</span>
                <div class="stat-label">Registered Bicycles</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${totalJobOffers}</span>
                <div class="stat-label">Job Offers</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${completedJobs}</span>
                <div class="stat-label">Completed Jobs</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">₪${totalRevenue.toFixed(2)}</span>
                <div class="stat-label">Total Revenue</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

function searchCustomers() {
    console.log('Searching customers');
    try {
        const query = document.getElementById('customerSearch').value;
        const searchResults = document.getElementById('searchResults');
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        const results = db.searchCustomers(query);
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No customers found.</p>';
            return;
        }
        
        searchResults.innerHTML = results.map(customer => {
            const profile = db.getCustomerProfile(customer.id);
            return `
                <div class="customer-profile">
                    <h4>${customer.name}</h4>
                    <div class="bicycle-info">
                        <div class="info-item">
                            <span class="info-label">Phone:</span>
                            <span>${customer.phoneNumber}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Visits:</span>
                            <span>${customer.totalVisits}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Spent:</span>
                            <span class="total-spent">₪${customer.totalSpent.toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Customer Since:</span>
                            <span>${new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="customer-bicycles">
                        <h5>Bicycles (${profile.bicycles.length}):</h5>
                        ${profile.bicycles.map(bike => `
                            <div class="bike-item">
                                <strong>${bike.brand}</strong> (${bike.color}) - ${bike.type}
                                <br>
                                <small>Repairs: ${bike.totalRepairs}</small>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="repair-summary">
                        <h5>Recent Repairs (${profile.repairs.length}):</h5>
                        ${profile.repairs.slice(-3).map(repair => `
                            <div class="bike-item">
                                <strong>₪${repair.totalAmount.toFixed(2)}</strong> - ${new Date(repair.completedAt).toLocaleDateString()}
                                <br>
                                <small>${repair.repairs.map(r => r.description).join(', ')}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error searching customers:', error);
    }
}

function clearDatabase() {
    console.log('Clearing database');
    try {
        if (confirm('Are you sure you want to clear ALL data? This action cannot be undone!')) {
            if (confirm('This will delete all customers, bicycles, and repair history. Are you absolutely sure?')) {
                localStorage.removeItem('workshop_customers');
                localStorage.removeItem('workshop_bicycles');
                localStorage.removeItem('workshop_job_offers');
                localStorage.removeItem('workshop_repair_history');
                
                // Reinitialize database
                db.customers = [];
                db.bicycles = [];
                db.jobOffers = [];
                db.repairHistory = [];
                
                alert('Database cleared successfully!');
                loadBicycleList();
                loadHistory();
                loadDatabaseStats();
                document.getElementById('searchResults').innerHTML = '';
                document.getElementById('customerSearch').value = '';
            }
        }
    } catch (error) {
        console.error('Error clearing database:', error);
        alert('Error clearing database: ' + error.message);
    }
}

// Search existing customers - WORKING
function searchExistingCustomers() {
    console.log('Searching existing customers');
    try {
        const query = document.getElementById('existingCustomerSearch').value;
        const resultsDiv = document.getElementById('existingCustomerResults');
        
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        const results = db.searchCustomers(query);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>No customers found. Try a different search term.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map(customer => {
            const profile = db.getCustomerProfile(customer.id);
            return `
                <div class="customer-result-card" onclick="selectExistingCustomer(${customer.id})">
                    <h4>${customer.name}</h4>
                    <div class="customer-result-info">
                        <div class="info-item">
                            <span class="info-label">Phone:</span>
                            <span>${customer.phoneNumber}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Visits:</span>
                            <span>${customer.totalVisits}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Spent:</span>
                            <span>₪${customer.totalSpent.toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Bicycles:</span>
                            <span>${profile.bicycles.length}</span>
                        </div>
                    </div>
                    ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
                    <p><em>Click to select this customer</em></p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error searching existing customers:', error);
    }
}

// Select existing customer - WORKING
function selectExistingCustomer(customerId) {
    console.log('Selecting existing customer:', customerId);
    try {
        selectedCustomerId = customerId;
        const customer = db.customers.find(c => c.id === customerId);
        const profile = db.getCustomerProfile(customerId);
        
        document.getElementById('existingCustomerSection').style.display = 'none';
        document.getElementById('selectedCustomerSection').style.display = 'block';
        
        // Set today's date for existing customer form
        const existingDate = document.getElementById('existingDate');
        if (existingDate) {
            existingDate.valueAsDate = new Date();
        }
        
        // Display selected customer info
        document.getElementById('selectedCustomerInfo').innerHTML = `
            <h3>Selected Customer: ${customer.name}</h3>
            <div class="bicycle-info">
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span>${customer.phoneNumber}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span>${customer.email || 'Not provided'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Visits:</span>
                    <span>${customer.totalVisits}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Spent:</span>
                    <span>₪${customer.totalSpent.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="customer-bicycles-list">
                <h4>Existing Bicycles (${profile.bicycles.length}):</h4>
                ${profile.bicycles.map(bike => `
                    <div class="existing-bike-item">
                        <strong>${bike.brand}</strong> (${bike.color}) - ${bike.type}
                        <br>
                        <small>Repairs: ${bike.totalRepairs} | 
                        Last Service: ${bike.lastServiceDate ? new Date(bike.lastServiceDate).toLocaleDateString() : 'Never'}</small>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error selecting existing customer:', error);
    }
}

// Initialize the application - WORKING
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    try {
        // Set today's date as default
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        // Initialize bicycle form
        const bicycleForm = document.getElementById('bicycleForm');
        if (bicycleForm) {
            bicycleForm.addEventListener('submit', registerBicycle);
        }
        
        // Initialize existing customer bicycle form
        const existingCustomerBicycleForm = document.getElementById('existingCustomerBicycleForm');
        if (existingCustomerBicycleForm) {
            existingCustomerBicycleForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                if (!selectedCustomerId) {
                    alert('No customer selected!');
                    return;
                }
                
                const bicycle = db.addBicycle({
                    brand: document.getElementById('existingBikeBrand').value,
                    color: document.getElementById('existingBikeColor').value,
                    type: document.querySelector('input[name="existingBikeType"]:checked').value,
                    additionalSpecs: document.getElementById('existingAdditionalSpecs').value
                }, selectedCustomerId);
                
                event.target.reset();
                alert('Bicycle added to existing customer successfully!');
                backToCustomerSelection();
                loadBicycleList();
            });
        }
        
        // Load existing data
        loadBicycleList();
        loadHistory();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

console.log('Workshop Management System loaded successfully');// 
Repair Services Management Functions - NEW FUNCTIONALITY

// Generate repair services list for job offers
function generateRepairServicesList() {
    const allServices = repairServices.getAllServices();
    
    return allServices.map(service => `
        <div class="repair-item">
            <input type="checkbox" id="${service.id}" name="repairs" value="${service.id}">
            <label for="${service.id}">${service.name}</label>
            <input type="number" placeholder="Price" step="0.01" min="0" id="price_${service.id}" value="${service.defaultPrice}">
            ${service.isCustom ? `<button type="button" onclick="removeServiceFromList('${service.id}')" class="remove-service-btn">×</button>` : ''}
        </div>
    `).join('');
}

// Add temporary repair (one-time use)
function addTemporaryRepair() {
    console.log('Adding temporary repair');
    try {
        const repairItems = document.getElementById('repairItems');
        const tempId = 'temp_' + Date.now();
        
        const div = document.createElement('div');
        div.className = 'repair-item temporary-repair';
        div.innerHTML = `
            <input type="checkbox" id="${tempId}" name="repairs" value="${tempId}">
            <input type="text" placeholder="Temporary repair description" id="desc_${tempId}" required style="flex: 1;">
            <input type="number" placeholder="Price" step="0.01" min="0" id="price_${tempId}" style="width: 120px;">
            <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="remove-service-btn">×</button>
        `;
        
        repairItems.appendChild(div);
        
        // Add event listeners
        div.querySelector('input[type="number"]').addEventListener('input', calculateTotal);
        div.querySelector('input[type="checkbox"]').addEventListener('change', calculateTotal);
    } catch (error) {
        console.error('Error adding temporary repair:', error);
    }
}

// Show add permanent service form
function showAddPermanentServiceForm() {
    console.log('Showing add permanent service form');
    try {
        const repairItems = document.getElementById('repairItems');
        
        // Check if form already exists
        if (document.getElementById('addPermanentServiceForm')) {
            return;
        }
        
        const formDiv = document.createElement('div');
        formDiv.id = 'addPermanentServiceForm';
        formDiv.className = 'add-service-form';
        formDiv.innerHTML = `
            <div class="form-header">
                <h5>Add Permanent Service</h5>
                <button type="button" onclick="cancelAddPermanentService()" class="remove-service-btn">×</button>
            </div>
            <div class="form-content">
                <input type="text" id="newServiceName" placeholder="Service name (e.g., Spoke Replacement)" required>
                <input type="number" id="newServicePrice" placeholder="Default price" step="0.01" min="0" required>
                <div class="form-actions">
                    <button type="button" onclick="addPermanentService()" class="add-service-btn">ADD SERVICE</button>
                    <button type="button" onclick="cancelAddPermanentService()" class="cancel-btn">CANCEL</button>
                </div>
            </div>
        `;
        
        repairItems.appendChild(formDiv);
        
        // Focus on service name input
        document.getElementById('newServiceName').focus();
    } catch (error) {
        console.error('Error showing add permanent service form:', error);
    }
}

// Add permanent service to the system
function addPermanentService() {
    console.log('Adding permanent service');
    try {
        const serviceName = document.getElementById('newServiceName').value.trim();
        const servicePrice = document.getElementById('newServicePrice').value;
        
        if (!serviceName) {
            alert('Please enter a service name');
            return;
        }
        
        if (!servicePrice || parseFloat(servicePrice) < 0) {
            alert('Please enter a valid price');
            return;
        }
        
        // Add service to the system
        const newService = repairServices.addCustomService(serviceName, servicePrice);
        
        // Remove the form
        cancelAddPermanentService();
        
        // Refresh the repair items list
        refreshRepairServicesList();
        
        alert(`Service "${serviceName}" added permanently to the system!`);
    } catch (error) {
        console.error('Error adding permanent service:', error);
        alert('Error adding service: ' + error.message);
    }
}

// Cancel add permanent service
function cancelAddPermanentService() {
    const form = document.getElementById('addPermanentServiceForm');
    if (form) {
        form.remove();
    }
}

// Refresh repair services list
function refreshRepairServicesList() {
    const repairItems = document.getElementById('repairItems');
    if (!repairItems) return;
    
    // Save current selections and values
    const currentSelections = {};
    const currentValues = {};
    
    document.querySelectorAll('.repair-item input[type="checkbox"]').forEach(checkbox => {
        currentSelections[checkbox.value] = checkbox.checked;
    });
    
    document.querySelectorAll('.repair-item input[type="number"]').forEach(input => {
        const serviceId = input.id.replace('price_', '');
        currentValues[serviceId] = input.value;
    });
    
    // Clear and regenerate the list
    repairItems.innerHTML = generateRepairServicesList();
    
    // Restore selections and values
    document.querySelectorAll('.repair-item input[type="checkbox"]').forEach(checkbox => {
        if (currentSelections[checkbox.value]) {
            checkbox.checked = true;
        }
    });
    
    document.querySelectorAll('.repair-item input[type="number"]').forEach(input => {
        const serviceId = input.id.replace('price_', '');
        if (currentValues[serviceId]) {
            input.value = currentValues[serviceId];
        }
    });
    
    // Re-add event listeners
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', calculateTotal);
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', calculateTotal);
    });
    
    // Recalculate total
    calculateTotal();
}

// Remove service from permanent list
function removeServiceFromList(serviceId) {
    if (confirm('Are you sure you want to remove this service permanently from the system?')) {
        repairServices.removeCustomService(serviceId);
        refreshRepairServicesList();
        alert('Service removed from the system');
    }
}

// Show repair services manager
function showRepairServicesManager() {
    console.log('Showing repair services manager');
    try {
        const jobsContent = document.getElementById('jobsContent');
        
        jobsContent.innerHTML = `
            <div class="services-manager">
                <button type="button" onclick="backToBicycleList()" class="back-btn" style="margin-bottom: 20px;">
                    ← BACK TO BICYCLE LIST
                </button>
                
                <h3>Repair Services Manager</h3>
                <p>Manage your permanent repair services that will appear in all job offers.</p>
                
                <div class="services-actions">
                    <button type="button" onclick="showAddServiceManagerForm()" class="add-service-btn">
                        + ADD NEW SERVICE
                    </button>
                    <button type="button" onclick="exportRepairServices()" class="export-btn">
                        EXPORT SERVICES
                    </button>
                </div>
                
                <div id="servicesManagerList" class="services-list">
                    ${generateServicesManagerList()}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error showing repair services manager:', error);
    }
}

// Generate services manager list
function generateServicesManagerList() {
    const allServices = repairServices.getAllServices();
    
    return `
        <div class="services-categories">
            <div class="service-category">
                <h4>Default Services</h4>
                <div class="services-grid">
                    ${repairServices.defaultServices.map(service => `
                        <div class="service-card default-service">
                            <div class="service-info">
                                <span class="service-name">${service.name}</span>
                                <span class="service-price">₪${service.defaultPrice}</span>
                            </div>
                            <span class="service-type">DEFAULT</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="service-category">
                <h4>Custom Services (${repairServices.customServices.length})</h4>
                <div class="services-grid">
                    ${repairServices.customServices.map(service => `
                        <div class="service-card custom-service">
                            <div class="service-info">
                                <span class="service-name">${service.name}</span>
                                <span class="service-price">₪${service.defaultPrice}</span>
                            </div>
                            <div class="service-actions">
                                <button onclick="editService('${service.id}')" class="edit-btn">EDIT</button>
                                <button onclick="deleteService('${service.id}')" class="delete-btn">DELETE</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${repairServices.customServices.length === 0 ? '<p class="no-services">No custom services added yet.</p>' : ''}
            </div>
        </div>
    `;
}

// Show add service manager form
function showAddServiceManagerForm() {
    const servicesManagerList = document.getElementById('servicesManagerList');
    
    // Check if form already exists
    if (document.getElementById('addServiceManagerForm')) {
        return;
    }
    
    const formDiv = document.createElement('div');
    formDiv.id = 'addServiceManagerForm';
    formDiv.className = 'service-manager-form';
    formDiv.innerHTML = `
        <div class="form-header">
            <h5>Add New Repair Service</h5>
            <button type="button" onclick="cancelAddServiceManager()" class="remove-service-btn">×</button>
        </div>
        <div class="form-content">
            <div class="form-group">
                <label for="managerServiceName">Service Name:</label>
                <input type="text" id="managerServiceName" placeholder="e.g., Spoke Replacement, Derailleur Adjustment" required>
            </div>
            <div class="form-group">
                <label for="managerServicePrice">Default Price (₪):</label>
                <input type="number" id="managerServicePrice" placeholder="0.00" step="0.01" min="0" required>
            </div>
            <div class="form-actions">
                <button type="button" onclick="addServiceFromManager()" class="add-service-btn">ADD SERVICE</button>
                <button type="button" onclick="cancelAddServiceManager()" class="cancel-btn">CANCEL</button>
            </div>
        </div>
    `;
    
    servicesManagerList.insertBefore(formDiv, servicesManagerList.firstChild);
    document.getElementById('managerServiceName').focus();
}

// Add service from manager
function addServiceFromManager() {
    try {
        const serviceName = document.getElementById('managerServiceName').value.trim();
        const servicePrice = document.getElementById('managerServicePrice').value;
        
        if (!serviceName) {
            alert('Please enter a service name');
            return;
        }
        
        if (!servicePrice || parseFloat(servicePrice) < 0) {
            alert('Please enter a valid price');
            return;
        }
        
        // Add service to the system
        repairServices.addCustomService(serviceName, servicePrice);
        
        // Remove the form
        cancelAddServiceManager();
        
        // Refresh the services list
        document.getElementById('servicesManagerList').innerHTML = generateServicesManagerList();
        
        alert(`Service "${serviceName}" added successfully!`);
    } catch (error) {
        console.error('Error adding service from manager:', error);
        alert('Error adding service: ' + error.message);
    }
}

// Cancel add service manager
function cancelAddServiceManager() {
    const form = document.getElementById('addServiceManagerForm');
    if (form) {
        form.remove();
    }
}

// Edit service
function editService(serviceId) {
    const service = repairServices.customServices.find(s => s.id === serviceId);
    if (!service) return;
    
    const newName = prompt('Enter new service name:', service.name);
    if (newName === null) return;
    
    const newPrice = prompt('Enter new default price:', service.defaultPrice);
    if (newPrice === null) return;
    
    if (!newName.trim()) {
        alert('Service name cannot be empty');
        return;
    }
    
    if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
        alert('Please enter a valid price');
        return;
    }
    
    repairServices.updateCustomService(serviceId, newName.trim(), newPrice);
    document.getElementById('servicesManagerList').innerHTML = generateServicesManagerList();
    alert('Service updated successfully!');
}

// Delete service
function deleteService(serviceId) {
    const service = repairServices.customServices.find(s => s.id === serviceId);
    if (!service) return;
    
    if (confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
        repairServices.removeCustomService(serviceId);
        document.getElementById('servicesManagerList').innerHTML = generateServicesManagerList();
        alert('Service deleted successfully!');
    }
}

// Export repair services
function exportRepairServices() {
    try {
        const servicesData = repairServices.exportServices();
        const dataStr = JSON.stringify(servicesData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `repair_services_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert('Repair services exported successfully!');
    } catch (error) {
        console.error('Error exporting repair services:', error);
        alert('Error exporting services: ' + error.message);
    }
}

console.log('Repair Services Management loaded successfully');