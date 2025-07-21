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
        const customer = this.customers.find(c => c.id === jobData.customerId);
        const ticketId = this.generateTicketId(customer);

        const jobOffer = {
            id: Date.now(),
            ticketId: ticketId,
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

    generateTicketId(customer) {
        if (!customer) return 'UNKNOWN-' + Date.now();

        // Get customer initials (first letter of each word in name)
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
        const customerTicketsToday = this.jobOffers.filter(job => {
            const jobDate = new Date(job.createdAt);
            return job.customerId === customer.id &&
                jobDate >= todayStart &&
                jobDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        }).length;

        const sequenceNumber = (customerTicketsToday + 1).toString().padStart(2, '0');

        // Format: INITIALS-PHONE4-YYMMDD-SEQ
        // Example: JD-1234-241221-01
        return `${initials}-${phoneDigits}-${dateStr}-${sequenceNumber}`;
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

    deleteJobOffer(jobOfferId) {
        const jobIndex = this.jobOffers.findIndex(j => j.id === jobOfferId);
        if (jobIndex === -1) return false;

        const jobOffer = this.jobOffers[jobIndex];

        // If job was completed, also remove from repair history and update customer/bicycle stats
        if (jobOffer.status === 'completed') {
            const repairIndex = this.repairHistory.findIndex(r => r.jobOfferId === jobOfferId);
            if (repairIndex !== -1) {
                this.repairHistory.splice(repairIndex, 1);
            }

            // Revert customer stats
            const customer = this.customers.find(c => c.id === jobOffer.customerId);
            if (customer) {
                customer.totalVisits = Math.max(0, customer.totalVisits - 1);
                customer.totalSpent = Math.max(0, customer.totalSpent - jobOffer.totalAmount);
            }

            // Revert bicycle stats
            const bicycle = this.bicycles.find(b => b.id === jobOffer.bicycleId);
            if (bicycle) {
                bicycle.totalRepairs = Math.max(0, bicycle.totalRepairs - 1);
                // Note: We don't revert lastServiceDate as it would be complex to determine the previous date
            }
        }

        // Remove the job offer
        this.jobOffers.splice(jobIndex, 1);
        this.saveToStorage();
        return true;
    }

    deleteBicycle(bicycleId) {
        const bicycleIndex = this.bicycles.findIndex(b => b.id === bicycleId);
        if (bicycleIndex === -1) return false;

        const bicycle = this.bicycles[bicycleIndex];

        // Remove all job offers related to this bicycle
        const relatedJobOffers = this.jobOffers.filter(j => j.bicycleId === bicycleId);
        relatedJobOffers.forEach(jobOffer => {
            this.deleteJobOffer(jobOffer.id);
        });

        // Remove all repair history related to this bicycle
        this.repairHistory = this.repairHistory.filter(r => r.bicycleId !== bicycleId);

        // Remove the bicycle
        this.bicycles.splice(bicycleIndex, 1);
        this.saveToStorage();
        return true;
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
            const bikeJobOffers = db.jobOffers.filter(j => j.bicycleId === bike.id);
            const latestTicket = bikeJobOffers.length > 0 ? bikeJobOffers[bikeJobOffers.length - 1] : null;

            return `
                <div class="bicycle-card">
                    <div class="bicycle-header">
                        <h3>${bike.brand} - ${customer ? customer.name : 'Unknown Customer'}</h3>
                        <div class="bicycle-actions">
                            <button onclick="editCustomerDetails(${customer ? customer.id : 'null'})" class="edit-customer-btn" title="Edit Customer Details">
                                👤
                            </button>
                            ${latestTicket ? `
                                <button onclick="editTicketDetails(${latestTicket.id})" class="edit-ticket-btn" title="Edit Latest Ticket">
                                    ✏️
                                </button>
                            ` : ''}
                            <button onclick="deleteBicycleFromList(${bike.id})" class="delete-bicycle-btn" title="Delete Bicycle">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    ${latestTicket ? `
                        <div class="ticket-info">
                            <div class="ticket-header">
                                <span class="ticket-id">🎫 ${latestTicket.ticketId || 'N/A'}</span>
                                <span class="ticket-status ${latestTicket.status}">${latestTicket.status.toUpperCase()}</span>
                            </div>
                            <div class="ticket-amount">₪${latestTicket.totalAmount.toFixed(2)}</div>
                        </div>
                    ` : ''}
                    
                    <div class="bicycle-content" onclick="createJobOffer(${bike.id})">
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
                            ${bikeJobOffers.length > 0 ? `
                                <div class="info-item">
                                    <span class="info-label">Total Tickets:</span>
                                    <span>${bikeJobOffers.length}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${bike.additionalSpecs ? `<p><strong>Specs:</strong> ${bike.additionalSpecs}</p>` : ''}
                        <p><em>Click to create job offer</em></p>
                    </div>
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
                        <button type="button" onclick="showAllRepairs()" style="background-color: #17a2b8; color: white;">↻ Show All Repairs</button>
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
                    <div class="job-header">
                        <h3>Ticket: ${job.ticketId || 'N/A'}</h3>
                        <span class="job-id">Job #${job.id}</span>
                    </div>
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
                    
                    <div class="job-actions" style="margin-top: 10px;">
                        ${job.status === 'pending' ? `
                            <button onclick="completeJob(${job.id})" style="background-color: #28a745; margin-right: 10px;">
                                Mark as Completed
                            </button>
                        ` : ''}
                        ${job.status === 'completed' ? `
                            <button onclick="printReceipt(${job.id})" style="background-color: #17a2b8; color: white; margin-right: 10px;">
                                🖨️ Print Receipt
                            </button>
                        ` : ''}
                        <button onclick="deleteJobFromHistory(${job.id})" style="background-color: #dc3545; color: white;">
                            Delete Job
                        </button>
                    </div>
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

// Delete job from history - NEW
function deleteJobFromHistory(jobOfferId) {
    console.log('Deleting job from history:', jobOfferId);
    try {
        const jobOffer = db.jobOffers.find(j => j.id === jobOfferId);
        if (!jobOffer) {
            alert('Job offer not found!');
            return;
        }

        const customer = db.customers.find(c => c.id === jobOffer.customerId);
        const bicycle = db.bicycles.find(b => b.id === jobOffer.bicycleId);

        const confirmMessage = `Are you sure you want to delete this job offer?\n\n` +
            `Customer: ${customer ? customer.name : 'Unknown'}\n` +
            `Bike: ${bicycle ? bicycle.brand : 'Unknown'}\n` +
            `Total: ₪${jobOffer.totalAmount.toFixed(2)}\n` +
            `Status: ${jobOffer.status}\n\n` +
            `${jobOffer.status === 'completed' ? 'Warning: This will also remove the repair record and revert customer/bicycle statistics.' : ''}`;

        if (confirm(confirmMessage)) {
            const success = db.deleteJobOffer(jobOfferId);
            if (success) {
                alert('Job offer deleted successfully!');
                loadHistory();
                loadBicycleList();
                loadDatabaseStats(); // Refresh database stats if on that tab
            } else {
                alert('Error deleting job offer!');
            }
        }
    } catch (error) {
        console.error('Error deleting job from history:', error);
        alert('Error deleting job: ' + error.message);
    }
}

// Delete bicycle from list - NEW
function deleteBicycleFromList(bicycleId) {
    console.log('Deleting bicycle from list:', bicycleId);
    try {
        const bicycle = db.bicycles.find(b => b.id === bicycleId);
        if (!bicycle) {
            alert('Bicycle not found!');
            return;
        }

        const customer = db.customers.find(c => c.id === bicycle.customerId);
        const relatedJobOffers = db.jobOffers.filter(j => j.bicycleId === bicycleId);
        const relatedRepairs = db.repairHistory.filter(r => r.bicycleId === bicycleId);

        let warningMessage = `Are you sure you want to delete this bicycle?\n\n` +
            `Customer: ${customer ? customer.name : 'Unknown'}\n` +
            `Bike: ${bicycle.brand} (${bicycle.color})\n` +
            `Type: ${bicycle.type}\n` +
            `Registered: ${new Date(bicycle.registeredAt).toLocaleDateString()}\n\n`;

        if (relatedJobOffers.length > 0 || relatedRepairs.length > 0) {
            warningMessage += `⚠️ WARNING: This will also delete:\n`;
            if (relatedJobOffers.length > 0) {
                warningMessage += `• ${relatedJobOffers.length} job offer(s)\n`;
            }
            if (relatedRepairs.length > 0) {
                warningMessage += `• ${relatedRepairs.length} repair record(s)\n`;
            }
            warningMessage += `\nThis action cannot be undone!`;
        }

        if (confirm(warningMessage)) {
            const success = db.deleteBicycle(bicycleId);
            if (success) {
                alert('Bicycle and all related records deleted successfully!');
                loadBicycleList();
                loadHistory();
                loadDatabaseStats(); // Refresh database stats if on that tab
            } else {
                alert('Error deleting bicycle!');
            }
        }
    } catch (error) {
        console.error('Error deleting bicycle from list:', error);
        alert('Error deleting bicycle: ' + error.message);
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
    const headers = ['Ticket ID', 'Job ID', 'Customer Name', 'Phone', 'Bicycle Brand', 'Total Amount', 'Status', 'Repairs', 'Notes', 'Created Date'];
    const csvContent = [
        headers.join(','),
        ...db.jobOffers.map(job => {
            const customer = db.customers.find(c => c.id === job.customerId);
            const bicycle = db.bicycles.find(b => b.id === job.bicycleId);
            const repairsText = job.repairs.map(r => `${r.description} (₪${r.price})`).join('; ');
            return [
                `"${job.ticketId || 'N/A'}"`,
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
        reader.onload = function (e) {
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

        // Automatically show all customers when database tab loads
        searchCustomers();
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

function searchCustomers() {
    console.log('Searching customers');
    try {
        const query = document.getElementById('customerSearch').value.trim();
        const searchResults = document.getElementById('searchResults');

        // Show all customers if no search query, otherwise filter
        const results = query.length === 0 ? db.customers : db.searchCustomers(query);

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-customers">
                    <p>No customers found.</p>
                    ${query.length > 0 ? `<p>Try searching with different keywords.</p>` : `<p>No customers registered yet.</p>`}
                </div>
            `;
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
                    
                    <div class="tickets-summary">
                        <h5>Tickets & Job Offers (${profile.jobOffers.length}):</h5>
                        ${profile.jobOffers.slice(-5).map(job => `
                            <div class="ticket-item">
                                <div class="ticket-header">
                                    <strong>🎫 ${job.ticketId || 'N/A'}</strong>
                                    <span class="ticket-status ${job.status}">${job.status.toUpperCase()}</span>
                                    <button onclick="editTicketDetails(${job.id})" class="edit-ticket-btn" title="Edit Ticket">✏️</button>
                                </div>
                                <div class="ticket-details">
                                    <span>₪${job.totalAmount.toFixed(2)} - ${new Date(job.createdAt).toLocaleDateString()}</span>
                                    <br>
                                    <small>${job.repairs.map(r => r.description).join(', ')}</small>
                                </div>
                            </div>
                        `).join('')}
                        ${profile.jobOffers.length > 5 ? `<small>Showing last 5 of ${profile.jobOffers.length} tickets</small>` : ''}
                    </div>
                    
                    <div class="repair-summary">
                        <h5>Completed Repairs (${profile.repairs.length}):</h5>
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
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    try {
        // Set today's date as default
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }

        const existingDateInput = document.getElementById('existingDate');
        if (existingDateInput) {
            existingDateInput.valueAsDate = new Date();
        }

        // Initialize bicycle form
        const bicycleForm = document.getElementById('bicycleForm');
        if (bicycleForm) {
            bicycleForm.addEventListener('submit', registerBicycle);
            console.log('Bicycle form event listener attached');
        }

        // Initialize existing customer bicycle form
        const existingCustomerBicycleForm = document.getElementById('existingCustomerBicycleForm');
        if (existingCustomerBicycleForm) {
            existingCustomerBicycleForm.addEventListener('submit', function (event) {
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
            console.log('Existing customer bicycle form event listener attached');
        }

        // Load existing data
        loadBicycleList();
        loadHistory();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

console.log('Workshop Management System loaded successfully');

// Repair Services Management Functions - NEW FUNCTIONALITY

// Generate repair services list for job offers
function generateRepairServicesList() {
    const allServices = repairServices.getAllServices();

    return allServices.map(service => `
        <div class="repair-item" id="repair_item_${service.id}">
            <input type="checkbox" id="${service.id}" name="repairs" value="${service.id}">
            <label for="${service.id}">${service.name}</label>
            <input type="number" placeholder="Price" step="0.01" min="0" id="price_${service.id}" value="${service.defaultPrice}">
            <button type="button" onclick="removeRepairFromJobOffer('${service.id}')" class="remove-service-btn" title="Remove from this job offer">×</button>
            ${service.isCustom ? `<button type="button" onclick="removeServiceFromList('${service.id}')" class="remove-service-btn delete-permanent" title="Delete permanently from system">🗑️</button>` : ''}
        </div>
    `).join('');
}

// Remove repair from current job offer (not permanently from system)
function removeRepairFromJobOffer(serviceId) {
    console.log('Removing repair from job offer:', serviceId);
    try {
        const repairItem = document.getElementById(`repair_item_${serviceId}`);
        if (repairItem) {
            // Uncheck the checkbox first
            const checkbox = repairItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }

            // Hide the repair item
            repairItem.style.display = 'none';

            // Recalculate total
            calculateTotal();

            // Show a message
            const serviceName = repairItem.querySelector('label').textContent;
            console.log(`${serviceName} removed from this job offer`);
        }
    } catch (error) {
        console.error('Error removing repair from job offer:', error);
    }
}

// Show all hidden repairs (restore removed repairs)
function showAllRepairs() {
    console.log('Showing all repairs');
    try {
        document.querySelectorAll('.repair-item').forEach(item => {
            item.style.display = 'flex';
        });
    } catch (error) {
        console.error('Error showing all repairs:', error);
    }
}

// Add temporary repair (one-time use)
function addTemporaryRepair() {
    console.log('Adding temporary repair');
    try {
        const repairItems = document.getElementById('repairItems');
        const tempId = 'temp_' + Date.now();

        const div = document.createElement('div');
        div.className = 'repair-item temporary-repair';
        div.id = `repair_item_${tempId}`;
        div.innerHTML = `
            <input type="checkbox" id="${tempId}" name="repairs" value="${tempId}">
            <input type="text" placeholder="Temporary repair description" id="desc_${tempId}" required style="flex: 1;">
            <input type="number" placeholder="Price" step="0.01" min="0" id="price_${tempId}" style="width: 120px;">
            <button type="button" onclick="removeRepairFromJobOffer('${tempId}')" class="remove-service-btn" title="Remove from this job offer">×</button>
            <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="remove-service-btn delete-permanent" title="Delete permanently">🗑️</button>
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
                            <div class="service-actions">
                                <button onclick="editDefaultService('${service.id}')" class="edit-btn">EDIT PRICE</button>
                                <button onclick="hideDefaultService('${service.id}')" class="hide-btn">HIDE</button>
                            </div>
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

// Edit default service price
function editDefaultService(serviceId) {
    const service = repairServices.defaultServices.find(s => s.id === serviceId);
    if (!service) return;

    const newPrice = prompt(`Edit price for "${service.name}":`, service.defaultPrice);
    if (newPrice === null) return;

    if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
        alert('Please enter a valid price');
        return;
    }

    // Update the default service price
    service.defaultPrice = parseFloat(newPrice);

    // Save to localStorage (we'll create a method for this)
    localStorage.setItem('workshop_default_services', JSON.stringify(repairServices.defaultServices));

    document.getElementById('servicesManagerList').innerHTML = generateServicesManagerList();
    alert('Default service price updated successfully!');
}

// Hide default service (add to hidden list)
function hideDefaultService(serviceId) {
    const service = repairServices.defaultServices.find(s => s.id === serviceId);
    if (!service) return;

    if (confirm(`Hide "${service.name}" from job offers? You can restore it later.`)) {
        // Get hidden services list
        let hiddenServices = JSON.parse(localStorage.getItem('workshop_hidden_services')) || [];

        if (!hiddenServices.includes(serviceId)) {
            hiddenServices.push(serviceId);
            localStorage.setItem('workshop_hidden_services', JSON.stringify(hiddenServices));
        }

        document.getElementById('servicesManagerList').innerHTML = generateServicesManagerList();
        alert('Service hidden from job offers!');
    }
}

// Export repair services
function exportRepairServices() {
    try {
        const servicesData = repairServices.exportServices();
        const dataStr = JSON.stringify(servicesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

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

// Edit ticket details - NEW
function editTicketDetails(jobId) {
    console.log('Editing ticket details for job:', jobId);
    try {
        const job = db.jobOffers.find(j => j.id === jobId);
        if (!job) {
            alert('Ticket not found!');
            return;
        }

        const customer = db.customers.find(c => c.id === job.customerId);
        const bicycle = db.bicycles.find(b => b.id === job.bicycleId);

        // Create edit form modal
        const modalHtml = `
            <div id="editTicketModal" class="modal-overlay" onclick="closeEditTicketModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Edit Ticket Details</h3>
                        <button onclick="closeEditTicketModal()" class="close-btn">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="ticket-info">
                            <h4>🎫 Ticket: ${job.ticketId || 'N/A'}</h4>
                            <p><strong>Customer:</strong> ${customer ? customer.name : 'Unknown'}</p>
                            <p><strong>Bike:</strong> ${bicycle ? bicycle.brand : 'Unknown'}</p>
                        </div>
                        
                        <form id="editTicketForm">
                            <div class="form-group">
                                <label for="editTicketId">Ticket ID:</label>
                                <input type="text" id="editTicketId" value="${job.ticketId || ''}" placeholder="Enter custom ticket ID">
                            </div>
                            
                            <div class="form-group">
                                <label for="editTicketStatus">Status:</label>
                                <select id="editTicketStatus">
                                    <option value="pending" ${job.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="in-progress" ${job.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="completed" ${job.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${job.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="editTicketNotes">Notes:</label>
                                <textarea id="editTicketNotes" rows="4" placeholder="Additional notes...">${job.notes || ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="editTicketTotal">Total Amount (₪):</label>
                                <input type="number" id="editTicketTotal" step="0.01" min="0" value="${job.totalAmount}">
                            </div>
                            
                            <div class="repairs-section">
                                <h5>Repairs & Services:</h5>
                                <div id="editRepairsList">
                                    ${job.repairs.map((repair, index) => `
                                        <div class="edit-repair-item">
                                            <input type="text" value="${repair.description}" id="repair_desc_${index}" placeholder="Repair description">
                                            <input type="number" value="${repair.price}" id="repair_price_${index}" step="0.01" min="0" placeholder="Price">
                                            <button type="button" onclick="removeEditRepair(${index})" class="remove-btn">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" onclick="addEditRepair()" class="add-repair-btn">+ Add Repair</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button onclick="saveTicketChanges(${job.id})" class="save-btn">Save Changes</button>
                        <button onclick="closeEditTicketModal()" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

    } catch (error) {
        console.error('Error editing ticket details:', error);
        alert('Error editing ticket: ' + error.message);
    }
}

// Close edit ticket modal
function closeEditTicketModal() {
    const modal = document.getElementById('editTicketModal');
    if (modal) {
        modal.remove();
    }
}

// Add repair to edit form
function addEditRepair() {
    const repairsList = document.getElementById('editRepairsList');
    const index = repairsList.children.length;

    const repairHtml = `
        <div class="edit-repair-item">
            <input type="text" value="" id="repair_desc_${index}" placeholder="Repair description">
            <input type="number" value="0" id="repair_price_${index}" step="0.01" min="0" placeholder="Price">
            <button type="button" onclick="removeEditRepair(${index})" class="remove-btn">×</button>
        </div>
    `;

    repairsList.insertAdjacentHTML('beforeend', repairHtml);
}

// Remove repair from edit form
function removeEditRepair(index) {
    const repairItem = document.querySelector(`#repair_desc_${index}`).parentElement;
    repairItem.remove();
}

// Save ticket changes
function saveTicketChanges(jobId) {
    console.log('Saving ticket changes for job:', jobId);
    try {
        const job = db.jobOffers.find(j => j.id === jobId);
        if (!job) {
            alert('Ticket not found!');
            return;
        }

        // Get form values
        const newTicketId = document.getElementById('editTicketId').value.trim();
        const newStatus = document.getElementById('editTicketStatus').value;
        const newNotes = document.getElementById('editTicketNotes').value.trim();
        const newTotal = parseFloat(document.getElementById('editTicketTotal').value) || 0;

        // Get repairs
        const newRepairs = [];
        document.querySelectorAll('.edit-repair-item').forEach((item, index) => {
            const desc = item.querySelector(`#repair_desc_${index}`)?.value.trim();
            const price = parseFloat(item.querySelector(`#repair_price_${index}`)?.value) || 0;

            if (desc) {
                newRepairs.push({
                    id: `edited_${Date.now()}_${index}`,
                    description: desc,
                    price: price
                });
            }
        });

        // Update job offer
        job.ticketId = newTicketId || job.ticketId;
        job.status = newStatus;
        job.notes = newNotes;
        job.totalAmount = newTotal;
        job.repairs = newRepairs;

        // Save to storage
        db.saveToStorage();

        // Close modal and refresh views
        closeEditTicketModal();
        loadHistory();
        loadDatabaseStats();
        searchCustomers(); // Refresh customer search if open

        alert('Ticket updated successfully!');

    } catch (error) {
        console.error('Error saving ticket changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}

console.log('Ticket editing functionality loaded successfully');

// Print Receipt Function - NEW
function printReceipt(jobId) {
    console.log('Printing receipt for job:', jobId);
    try {
        const job = db.jobOffers.find(j => j.id === jobId);
        if (!job) {
            alert('Job not found!');
            return;
        }

        const customer = db.customers.find(c => c.id === job.customerId);
        const bicycle = db.bicycles.find(b => b.id === job.bicycleId);

        // Create receipt content optimized for thermal printers (58mm width)
        const receiptContent = generateReceiptContent(job, customer, bicycle);

        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=400,height=600');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${job.ticketId}</title>
                <style>
                    @media print {
                        @page {
                            size: 58mm auto;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 2mm;
                        }
                    }
                    
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        margin: 0;
                        padding: 5px;
                        width: 58mm;
                        background: white;
                        color: black;
                    }
                    
                    .receipt-header {
                        text-align: center;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 5px;
                        margin-bottom: 8px;
                    }
                    
                    .shop-name {
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 2px;
                    }
                    
                    .shop-info {
                        font-size: 10px;
                        margin-bottom: 1px;
                    }
                    
                    .ticket-info {
                        text-align: center;
                        margin: 8px 0;
                        font-weight: bold;
                    }
                    
                    .customer-info {
                        margin: 8px 0;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 5px;
                    }
                    
                    .info-line {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                        font-size: 11px;
                    }
                    
                    .repairs-section {
                        margin: 8px 0;
                    }
                    
                    .repair-item {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                        font-size: 11px;
                    }
                    
                    .repair-desc {
                        flex: 1;
                        padding-right: 5px;
                    }
                    
                    .repair-price {
                        font-weight: bold;
                    }
                    
                    .total-section {
                        border-top: 1px dashed #000;
                        border-bottom: 1px dashed #000;
                        padding: 5px 0;
                        margin: 8px 0;
                    }
                    
                    .total-line {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 8px;
                        font-size: 10px;
                    }
                    
                    .notes {
                        margin: 8px 0;
                        font-size: 10px;
                        font-style: italic;
                    }
                    
                    .print-only {
                        display: none;
                    }
                    
                    @media print {
                        .print-only {
                            display: block;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                    
                    .print-button {
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 10px;
                        font-size: 14px;
                    }
                    
                    .print-button:hover {
                        background: #2980b9;
                    }
                </style>
            </head>
            <body>
                ${receiptContent}
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
                    <button class="print-button" onclick="window.close()" style="background: #95a5a6;">Close</button>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();

        // Auto-focus the print window
        printWindow.focus();

        // Optional: Auto-print after a short delay
        setTimeout(() => {
            if (confirm('Print receipt now?')) {
                printWindow.print();
            }
        }, 500);

    } catch (error) {
        console.error('Error printing receipt:', error);
        alert('Error printing receipt: ' + error.message);
    }
}

// Generate receipt content
function generateReceiptContent(job, customer, bicycle) {
    const now = new Date();
    const completedDate = job.completedAt ? new Date(job.completedAt) : now;

    return `
        <div class="receipt-header">
            <div class="shop-name">BICYCLE WORKSHOP</div>
            <div class="shop-info">Professional Repair Service</div>
            <div class="shop-info">Tel: Your-Phone-Number</div>
            <div class="shop-info">Email: your-email@domain.com</div>
        </div>
        
        <div class="ticket-info">
            TICKET: ${job.ticketId || 'N/A'}
        </div>
        
        <div class="customer-info">
            <div class="info-line">
                <span>Customer:</span>
                <span>${customer ? customer.name : 'Unknown'}</span>
            </div>
            <div class="info-line">
                <span>Phone:</span>
                <span>${customer ? customer.phoneNumber : 'N/A'}</span>
            </div>
            <div class="info-line">
                <span>Bicycle:</span>
                <span>${bicycle ? bicycle.brand : 'Unknown'}</span>
            </div>
            <div class="info-line">
                <span>Color:</span>
                <span>${bicycle ? bicycle.color : 'N/A'}</span>
            </div>
            <div class="info-line">
                <span>Type:</span>
                <span>${bicycle ? bicycle.type : 'N/A'}</span>
            </div>
        </div>
        
        <div class="repairs-section">
            <div style="font-weight: bold; margin-bottom: 5px;">SERVICES PERFORMED:</div>
            ${job.repairs.map(repair => `
                <div class="repair-item">
                    <span class="repair-desc">${repair.description}</span>
                    <span class="repair-price">₪${repair.price.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="total-section">
            <div class="total-line">
                <span>TOTAL:</span>
                <span>₪${job.totalAmount.toFixed(2)}</span>
            </div>
        </div>
        
        ${job.notes ? `
            <div class="notes">
                <strong>Notes:</strong> ${job.notes}
            </div>
        ` : ''}
        
        <div class="customer-info">
            <div class="info-line">
                <span>Date:</span>
                <span>${completedDate.toLocaleDateString()}</span>
            </div>
            <div class="info-line">
                <span>Time:</span>
                <span>${completedDate.toLocaleTimeString()}</span>
            </div>
            <div class="info-line">
                <span>Status:</span>
                <span>${job.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="footer">
            <div>Thank you for choosing our service!</div>
            <div>Visit us again for all your bicycle needs</div>
            <div style="margin-top: 5px;">Job ID: ${job.id}</div>
        </div>
    `;
}

console.log('Receipt printing functionality loaded successfully');

// Edit Customer Details Function - NEW
function editCustomerDetails(customerId) {
    console.log('Editing customer details for ID:', customerId);
    try {
        if (!customerId || customerId === 'null') {
            alert('Customer not found!');
            return;
        }

        const customer = db.customers.find(c => c.id === customerId);
        if (!customer) {
            alert('Customer not found!');
            return;
        }

        // Create customer edit modal
        const modalHtml = `
            <div id="editCustomerModal" class="modal-overlay" onclick="closeEditCustomerModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Edit Customer Details</h3>
                        <button onclick="closeEditCustomerModal()" class="close-btn">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="customer-info">
                            <h4>👤 Customer: ${customer.name}</h4>
                            <p><strong>Customer Since:</strong> ${new Date(customer.createdAt).toLocaleDateString()}</p>
                            <p><strong>Total Visits:</strong> ${customer.totalVisits}</p>
                            <p><strong>Total Spent:</strong> ₪${customer.totalSpent.toFixed(2)}</p>
                        </div>
                        
                        <form id="editCustomerForm">
                            <div class="form-group">
                                <label for="editCustomerName">Customer Name:</label>
                                <input type="text" id="editCustomerName" value="${customer.name}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="editCustomerPhone">Phone Number:</label>
                                <input type="tel" id="editCustomerPhone" value="${customer.phoneNumber}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="editCustomerEmail">Email:</label>
                                <input type="email" id="editCustomerEmail" value="${customer.email || ''}" placeholder="Optional">
                            </div>
                            
                            <div class="form-group">
                                <label for="editCustomerAddress">Address:</label>
                                <textarea id="editCustomerAddress" rows="3" placeholder="Optional">${customer.address || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button onclick="saveCustomerChanges(${customer.id})" class="save-btn">Save Changes</button>
                        <button onclick="closeEditCustomerModal()" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

    } catch (error) {
        console.error('Error editing customer details:', error);
        alert('Error editing customer: ' + error.message);
    }
}

// Close edit customer modal
function closeEditCustomerModal() {
    const modal = document.getElementById('editCustomerModal');
    if (modal) {
        modal.remove();
    }
}

// Save customer changes
function saveCustomerChanges(customerId) {
    console.log('Saving customer changes for ID:', customerId);
    try {
        const customer = db.customers.find(c => c.id === customerId);
        if (!customer) {
            alert('Customer not found!');
            return;
        }

        // Get form values
        const newName = document.getElementById('editCustomerName').value.trim();
        const newPhone = document.getElementById('editCustomerPhone').value.trim();
        const newEmail = document.getElementById('editCustomerEmail').value.trim();
        const newAddress = document.getElementById('editCustomerAddress').value.trim();

        // Validate required fields
        if (!newName) {
            alert('Customer name is required!');
            return;
        }

        if (!newPhone) {
            alert('Phone number is required!');
            return;
        }

        // Check if phone number is already used by another customer
        const existingCustomer = db.customers.find(c => c.phoneNumber === newPhone && c.id !== customerId);
        if (existingCustomer) {
            alert('This phone number is already used by another customer!');
            return;
        }

        // Update customer data
        customer.name = newName;
        customer.phoneNumber = newPhone;
        customer.email = newEmail;
        customer.address = newAddress;

        // Save to storage
        db.saveToStorage();

        // Close modal and refresh views
        closeEditCustomerModal();
        loadBicycleList();
        loadHistory();
        loadDatabaseStats();

        alert('Customer details updated successfully!');

    } catch (error) {
        console.error('Error saving customer changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}

console.log('Customer editing functionality loaded successfully');