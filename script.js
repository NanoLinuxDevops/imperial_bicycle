// Workshop Management System - Local Database
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

// Global variables
let selectedCustomerId = null;

// Tab functionality - FIXED
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
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
}

// Customer Selection Functions
function showNewCustomerForm() {
    document.getElementById('customerSelection').style.display = 'none';
    document.getElementById('newCustomerSection').style.display = 'block';
    document.getElementById('existingCustomerSection').style.display = 'none';
    document.getElementById('selectedCustomerSection').style.display = 'none';
}

function showExistingCustomerSearch() {
    document.getElementById('customerSelection').style.display = 'none';
    document.getElementById('newCustomerSection').style.display = 'none';
    document.getElementById('existingCustomerSection').style.display = 'block';
    document.getElementById('selectedCustomerSection').style.display = 'none';
    
    document.getElementById('existingCustomerSearch').value = '';
    document.getElementById('existingCustomerResults').innerHTML = '';
}

function backToCustomerSelection() {
    document.getElementById('customerSelection').style.display = 'block';
    document.getElementById('newCustomerSection').style.display = 'none';
    document.getElementById('existingCustomerSection').style.display = 'none';
    document.getElementById('selectedCustomerSection').style.display = 'none';
    
    const bicycleForm = document.getElementById('bicycleForm');
    if (bicycleForm) bicycleForm.reset();
    selectedCustomerId = null;
}

function backToExistingCustomerSearch() {
    document.getElementById('existingCustomerSection').style.display = 'block';
    document.getElementById('selectedCustomerSection').style.display = 'none';
    selectedCustomerId = null;
}

// Register new bicycle
function registerBicycle(event) {
    event.preventDefault();
    
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
}

// Load bicycle list for job offers
function loadBicycleList() {
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
}

// Create job offer for selected bicycle
function createJobOffer(bicycleId) {
    const bicycle = db.bicycles.find(b => b.id === bicycleId);
    if (!bicycle) return;
    
    const customer = db.customers.find(c => c.id === bicycle.customerId);
    const jobsContent = document.getElementById('jobsContent');
    
    jobsContent.innerHTML = `
        <div class="job-form">
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
            
            <h4>Repairs & Services</h4>
            <form id="jobOfferForm" onsubmit="saveJobOffer(event, ${bicycleId})">
                <div id="repairItems">
                    <div class="repair-item">
                        <input type="checkbox" id="brake_adjustment" name="repairs" value="brake_adjustment">
                        <label for="brake_adjustment">Brake Adjustment</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_brake_adjustment">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="gear_tuning" name="repairs" value="gear_tuning">
                        <label for="gear_tuning">Gear Tuning</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_gear_tuning">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="chain_replacement" name="repairs" value="chain_replacement">
                        <label for="chain_replacement">Chain Replacement</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_chain_replacement">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="tire_replacement" name="repairs" value="tire_replacement">
                        <label for="tire_replacement">Tire Replacement</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_tire_replacement">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="brake_pad_replacement" name="repairs" value="brake_pad_replacement">
                        <label for="brake_pad_replacement">Brake Pad Replacement</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_brake_pad_replacement">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="wheel_truing" name="repairs" value="wheel_truing">
                        <label for="wheel_truing">Wheel Truing</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_wheel_truing">
                    </div>
                    
                    <div class="repair-item">
                        <input type="checkbox" id="full_service" name="repairs" value="full_service">
                        <label for="full_service">Full Service</label>
                        <input type="number" placeholder="Price" step="0.01" min="0" id="price_full_service">
                    </div>
                </div>
                
                <button type="button" onclick="addCustomRepair()">+ Add Custom Repair</button>
                
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
                <button type="button" onclick="loadBicycleList()">Back to List</button>
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
}

// Add custom repair item
function addCustomRepair() {
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
}

// Calculate total price
function calculateTotal() {
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
}

// Save job offer
function saveJobOffer(event, bicycleId) {
    event.preventDefault();
    
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
}

// Load history
function loadHistory() {
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
}

// Complete a job
function completeJob(jobOfferId) {
    const repairRecord = db.completeJob(jobOfferId);
    if (repairRecord) {
        alert('Job completed successfully!');
        loadHistory();
        loadBicycleList();
    }
}

// Database management functions
function exportData() {
    const data = db.exportDatabase();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `workshop_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData(event) {
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
}

function loadDatabaseStats() {
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
}

function searchCustomers() {
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
}

function clearDatabase() {
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
}

// Search existing customers
function searchExistingCustomers() {
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
}

// Select existing customer
function selectExistingCustomer(customerId) {
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
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
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
});