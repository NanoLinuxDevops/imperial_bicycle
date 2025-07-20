// CSV Export and Local File System Functions

// Function to convert data to CSV format
function convertToCSV(data, headers) {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Function to save CSV file to local directory
function saveCSVToLocal(filename, csvContent) {
    // Create a blob with CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export customers to CSV
function exportCustomersCSV() {
    const headers = ['id', 'name', 'phoneNumber', 'email', 'address', 'totalVisits', 'totalSpent', 'createdAt'];
    const csvContent = convertToCSV(db.customers, headers);
    const filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    saveCSVToLocal(filename, csvContent);
    showNotification('Customers exported to CSV successfully!', 'success');
}

// Export bicycles to CSV
function exportBicyclesCSV() {
    const bicyclesWithCustomer = db.bicycles.map(bike => {
        const customer = db.customers.find(c => c.id === bike.customerId);
        return {
            ...bike,
            customerName: customer ? customer.name : 'Unknown',
            customerPhone: customer ? customer.phoneNumber : 'N/A'
        };
    });
    
    const headers = ['id', 'customerName', 'customerPhone', 'brand', 'model', 'color', 'type', 'additionalSpecs', 'totalRepairs', 'registeredAt', 'lastServiceDate'];
    const csvContent = convertToCSV(bicyclesWithCustomer, headers);
    const filename = `bicycles_${new Date().toISOString().split('T')[0]}.csv`;
    saveCSVToLocal(filename, csvContent);
    showNotification('Bicycles exported to CSV successfully!', 'success');
}

// Export job offers to CSV
function exportJobOffersCSV() {
    const jobOffersWithDetails = db.jobOffers.map(job => {
        const customer = db.customers.find(c => c.id === job.customerId);
        const bicycle = db.bicycles.find(b => b.id === job.bicycleId);
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
    });
    
    const headers = ['id', 'customerName', 'customerPhone', 'bicycleBrand', 'bicycleColor', 'repairs', 'totalAmount', 'status', 'notes', 'createdAt', 'completedAt'];
    const csvContent = convertToCSV(jobOffersWithDetails, headers);
    const filename = `job_offers_${new Date().toISOString().split('T')[0]}.csv`;
    saveCSVToLocal(filename, csvContent);
    showNotification('Job offers exported to CSV successfully!', 'success');
}

// Export repair history to CSV
function exportRepairHistoryCSV() {
    const repairHistoryWithDetails = db.repairHistory.map(repair => {
        const customer = db.customers.find(c => c.id === repair.customerId);
        const bicycle = db.bicycles.find(b => b.id === repair.bicycleId);
        const repairsList = repair.repairs.map(r => `${r.description} (₪${r.price})`).join('; ');
        
        return {
            id: repair.id,
            customerName: customer ? customer.name : 'Unknown',
            customerPhone: customer ? customer.phoneNumber : 'N/A',
            bicycleBrand: bicycle ? bicycle.brand : 'Unknown',
            bicycleColor: bicycle ? bicycle.color : 'Unknown',
            repairs: repairsList,
            totalAmount: repair.totalAmount,
            notes: repair.notes || '',
            completedAt: repair.completedAt
        };
    });
    
    const headers = ['id', 'customerName', 'customerPhone', 'bicycleBrand', 'bicycleColor', 'repairs', 'totalAmount', 'notes', 'completedAt'];
    const csvContent = convertToCSV(repairHistoryWithDetails, headers);
    const filename = `repair_history_${new Date().toISOString().split('T')[0]}.csv`;
    saveCSVToLocal(filename, csvContent);
    showNotification('Repair history exported to CSV successfully!', 'success');
}

// Export all data to separate CSV files
function exportAllToCSV() {
    exportCustomersCSV();
    setTimeout(() => exportBicyclesCSV(), 500);
    setTimeout(() => exportJobOffersCSV(), 1000);
    setTimeout(() => exportRepairHistoryCSV(), 1500);
    
    showNotification('All data exported to CSV files!', 'success');
}

// Auto-save to CSV every time data changes
function autoSaveToCSV() {
    // Save customers
    const customersCSV = convertToCSV(db.customers, ['id', 'name', 'phoneNumber', 'email', 'address', 'totalVisits', 'totalSpent', 'createdAt']);
    localStorage.setItem('csv_customers', customersCSV);
    
    // Save bicycles
    const bicyclesWithCustomer = db.bicycles.map(bike => {
        const customer = db.customers.find(c => c.id === bike.customerId);
        return {
            ...bike,
            customerName: customer ? customer.name : 'Unknown',
            customerPhone: customer ? customer.phoneNumber : 'N/A'
        };
    });
    const bicyclesCSV = convertToCSV(bicyclesWithCustomer, ['id', 'customerName', 'customerPhone', 'brand', 'model', 'color', 'type', 'additionalSpecs', 'totalRepairs', 'registeredAt', 'lastServiceDate']);
    localStorage.setItem('csv_bicycles', bicyclesCSV);
    
    // Save job offers
    const jobOffersWithDetails = db.jobOffers.map(job => {
        const customer = db.customers.find(c => c.id === job.customerId);
        const bicycle = db.bicycles.find(b => b.id === job.bicycleId);
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
    });
    const jobOffersCSV = convertToCSV(jobOffersWithDetails, ['id', 'customerName', 'customerPhone', 'bicycleBrand', 'bicycleColor', 'repairs', 'totalAmount', 'status', 'notes', 'createdAt', 'completedAt']);
    localStorage.setItem('csv_job_offers', jobOffersCSV);
    
    console.log('Data auto-saved to CSV format in localStorage');
}

// Show notification function (if not already defined)
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}