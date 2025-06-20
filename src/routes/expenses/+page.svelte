<script>
    import { Receipt, Filter, Search, Calendar } from 'lucide-svelte';
    
    let searchQuery = '';
    let selectedCategory = 'all';
    let selectedPeriod = 'all';
    let sortBy = 'date';
    let sortOrder = 'desc';
</script>

<svelte:head>
    <title>Expenses - CostAnalyzer</title>
</svelte:head>

<div class="expenses-page">
    <div class="page-header">
        <Receipt size={32} />
        <div>
            <h1>Expense Management</h1>
            <p>View, categorize, and analyze your expenses in detail</p>
        </div>
    </div>
    
    <!-- Filters and Search -->
    <div class="filters-section card">
        <div class="filters-header">
            <Filter size={20} />
            <h3>Filter & Search Expenses</h3>
        </div>
        
        <div class="filters-grid">
            <div class="filter-group">
                <label for="search">
                    <Search size={16} />
                    Search Expenses
                </label>
                <input 
                    id="search"
                    type="text" 
                    placeholder="Search by description, vendor, etc."
                    bind:value={searchQuery}
                    class="search-input"
                />
            </div>
            
            <div class="filter-group">
                <label for="category">Category</label>
                <select id="category" bind:value={selectedCategory} class="filter-select">
                    <option value="all">All Categories</option>
                    <option value="office">Office Supplies</option>
                    <option value="travel">Travel</option>
                    <option value="marketing">Marketing</option>
                    <option value="utilities">Utilities</option>
                    <option value="software">Software</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="period">
                    <Calendar size={16} />
                    Time Period
                </label>
                <select id="period" bind:value={selectedPeriod} class="filter-select">
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisQuarter">This Quarter</option>
                    <option value="thisYear">This Year</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="sort">Sort By</label>
                <select id="sort" bind:value={sortBy} class="filter-select">
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                    <option value="vendor">Vendor</option>
                </select>
            </div>
        </div>
    </div>
    
    <!-- Expense Summary -->
    <div class="summary-section">
        <div class="summary-cards grid grid-4">
            <div class="summary-card card">
                <h4>Total Expenses</h4>
                <div class="summary-value">No data</div>
                <div class="summary-note">Upload expense data to see totals</div>
            </div>
            
            <div class="summary-card card">
                <h4>This Month</h4>
                <div class="summary-value">No data</div>
                <div class="summary-note">Current month expenses</div>
            </div>
            
            <div class="summary-card card">
                <h4>Average per Month</h4>
                <div class="summary-value">No data</div>
                <div class="summary-note">Based on available data</div>
            </div>
            
            <div class="summary-card card">
                <h4>Largest Category</h4>
                <div class="summary-value">No data</div>
                <div class="summary-note">Highest spending category</div>
            </div>
        </div>
    </div>
    
    <!-- Expenses Table -->
    <div class="expenses-table-section card">
        <div class="table-header">
            <h3>Expense Details</h3>
            <div class="table-actions">
                <button class="btn btn-secondary">Export</button>
                <button class="btn">Add Expense</button>
            </div>
        </div>
        
        <div class="table-container">
            <div class="empty-state">
                <Receipt size={48} />
                <h4>No Expense Data Available</h4>
                <p>Upload your expense data to view and manage expenses here.</p>
                <div class="empty-actions">
                    <a href="/upload" class="btn">Upload Expenses</a>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Expense Categories -->
    <div class="categories-section">
        <div class="categories-header">
            <h3>Expense Categories</h3>
            <p>Manage and organize your expense categories</p>
        </div>
        
        <div class="categories-grid">
            <div class="category-card card">
                <h4>Office Supplies</h4>
                <div class="category-stats">
                    <div class="stat">
                        <span class="stat-label">Count:</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">$0</span>
                    </div>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="category-card card">
                <h4>Travel & Transport</h4>
                <div class="category-stats">
                    <div class="stat">
                        <span class="stat-label">Count:</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">$0</span>
                    </div>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="category-card card">
                <h4>Marketing</h4>
                <div class="category-stats">
                    <div class="stat">
                        <span class="stat-label">Count:</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">$0</span>
                    </div>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="category-card card">
                <h4>Software & Tools</h4>
                <div class="category-stats">
                    <div class="stat">
                        <span class="stat-label">Count:</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">$0</span>
                    </div>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: 0%"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .expenses-page {
        max-width: 1200px;
    }
    
    .page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        color: var(--accent-color);
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 2rem;
        color: var(--text-primary);
    }
    
    .page-header p {
        margin: 0;
        color: var(--text-secondary);
    }
    
    .filters-section {
        margin-bottom: 2rem;
    }
    
    .filters-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: var(--accent-color);
    }
    
    .filters-header h3 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .filter-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }
    
    .search-input,
    .filter-select {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.875rem;
    }
    
    .search-input:focus,
    .filter-select:focus {
        outline: none;
        border-color: var(--accent-color);
    }
    
    .summary-section {
        margin-bottom: 2rem;
    }
    
    .summary-card h4 {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .summary-note {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .expenses-table-section {
        margin-bottom: 2rem;
    }
    
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .table-header h3 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .table-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .table-container {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .empty-actions {
        margin-top: 1rem;
    }
    
    .categories-section {
        margin-top: 2rem;
    }
    
    .categories-header {
        margin-bottom: 1.5rem;
    }
    
    .categories-header h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .categories-header p {
        color: var(--text-secondary);
    }
    
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    
    .category-card h4 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .category-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }
    
    .stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .stat-value {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .category-bar {
        height: 6px;
        background-color: var(--border-color);
        border-radius: 3px;
        overflow: hidden;
    }
    
    .category-fill {
        height: 100%;
        background-color: var(--accent-color);
        transition: width 0.3s ease;
    }
    
    @media (max-width: 768px) {
        .filters-grid {
            grid-template-columns: 1fr;
        }
        
        .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }
        
        .table-actions {
            justify-content: stretch;
        }
        
        .table-actions .btn {
            flex: 1;
        }
    }
</style>
