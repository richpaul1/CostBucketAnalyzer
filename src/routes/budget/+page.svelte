<script>
    import { Target, Plus, Edit, Trash2, AlertTriangle } from 'lucide-svelte';
    
    let showAddBudget = false;
    let newBudgetCategory = '';
    let newBudgetAmount = '';
    let newBudgetPeriod = 'monthly';
    
    function addBudget() {
        if (!newBudgetCategory || !newBudgetAmount) return;
        
        // In a real app, this would save to backend
        console.log('Adding budget:', {
            category: newBudgetCategory,
            amount: newBudgetAmount,
            period: newBudgetPeriod
        });
        
        // Reset form
        newBudgetCategory = '';
        newBudgetAmount = '';
        newBudgetPeriod = 'monthly';
        showAddBudget = false;
    }
    
    function cancelAdd() {
        newBudgetCategory = '';
        newBudgetAmount = '';
        newBudgetPeriod = 'monthly';
        showAddBudget = false;
    }
</script>

<svelte:head>
    <title>Budget Planning - CostAnalyzer</title>
</svelte:head>

<div class="budget-page">
    <div class="page-header">
        <Target size={32} />
        <div>
            <h1>Budget Planning</h1>
            <p>Set budget limits and track spending against your financial goals</p>
        </div>
    </div>
    
    <!-- Budget Overview -->
    <div class="budget-overview">
        <div class="overview-cards grid grid-3">
            <div class="overview-card card">
                <h4>Total Budget</h4>
                <div class="overview-value">$0</div>
                <div class="overview-note">No budgets configured</div>
            </div>
            
            <div class="overview-card card">
                <h4>Spent This Month</h4>
                <div class="overview-value">$0</div>
                <div class="overview-note">No expense data available</div>
            </div>
            
            <div class="overview-card card">
                <h4>Remaining Budget</h4>
                <div class="overview-value">$0</div>
                <div class="overview-note">Set budgets to track remaining amounts</div>
            </div>
        </div>
    </div>
    
    <!-- Budget Categories -->
    <div class="budget-categories-section card">
        <div class="section-header">
            <h3>Budget Categories</h3>
            <button 
                class="btn" 
                on:click={() => showAddBudget = true}
                disabled={showAddBudget}
            >
                <Plus size={16} />
                Add Budget
            </button>
        </div>
        
        {#if showAddBudget}
            <div class="add-budget-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="category">Category</label>
                        <input 
                            id="category"
                            type="text" 
                            placeholder="e.g., Office Supplies, Travel"
                            bind:value={newBudgetCategory}
                            class="form-input"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="amount">Budget Amount</label>
                        <input 
                            id="amount"
                            type="number" 
                            placeholder="0.00"
                            bind:value={newBudgetAmount}
                            class="form-input"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="period">Period</label>
                        <select id="period" bind:value={newBudgetPeriod} class="form-select">
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-secondary" on:click={cancelAdd}>Cancel</button>
                    <button class="btn" on:click={addBudget}>Add Budget</button>
                </div>
            </div>
        {/if}
        
        <div class="budget-list">
            <div class="empty-state">
                <Target size={48} />
                <h4>No Budget Categories Configured</h4>
                <p>Create budget categories to start tracking your spending against financial goals.</p>
                {#if !showAddBudget}
                    <button class="btn" on:click={() => showAddBudget = true}>
                        <Plus size={16} />
                        Create First Budget
                    </button>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- Budget Performance -->
    <div class="performance-section">
        <h3>Budget Performance</h3>
        <p>Track how your actual spending compares to your budget goals</p>
        
        <div class="performance-cards grid grid-2">
            <div class="performance-card card">
                <h4>Monthly Performance</h4>
                <div class="empty-state">
                    <p>No performance data available</p>
                    <small>Set budgets and upload expense data to see performance metrics</small>
                </div>
            </div>
            
            <div class="performance-card card">
                <h4>Category Breakdown</h4>
                <div class="empty-state">
                    <p>No category data available</p>
                    <small>Create budget categories to see spending breakdown</small>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Budget Alerts -->
    <div class="alerts-section card">
        <div class="alerts-header">
            <AlertTriangle size={24} />
            <h3>Budget Alerts</h3>
        </div>
        
        <div class="alerts-content">
            <div class="empty-state">
                <h4>No Budget Alerts</h4>
                <p>Budget alerts will appear here when:</p>
                <ul style="text-align: left; margin-top: 1rem;">
                    <li>You're approaching your budget limit (80% threshold)</li>
                    <li>You've exceeded your budget for any category</li>
                    <li>Unusual spending patterns are detected</li>
                </ul>
            </div>
        </div>
        
        <div class="alert-settings">
            <h4>Alert Settings</h4>
            <div class="settings-grid">
                <div class="setting-item">
                    <label>
                        <input type="checkbox" checked />
                        Email notifications for budget alerts
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" checked />
                        Alert when 80% of budget is reached
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" />
                        Weekly budget summary emails
                    </label>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Getting Started Guide -->
    <div class="guide-section card">
        <h3>Budget Planning Guide</h3>
        <p>Follow these steps to set up effective budget management:</p>
        
        <div class="guide-steps">
            <div class="guide-step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h4>Create Budget Categories</h4>
                    <p>Start by creating budget categories that match your expense types (e.g., Office Supplies, Travel, Marketing).</p>
                </div>
            </div>
            
            <div class="guide-step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h4>Set Realistic Amounts</h4>
                    <p>Based on historical spending, set realistic budget amounts for each category. Start conservative and adjust as needed.</p>
                </div>
            </div>
            
            <div class="guide-step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h4>Upload Expense Data</h4>
                    <p>Upload your current expense data to start tracking actual spending against your budgets.</p>
                    <a href="/upload" class="btn btn-secondary">Upload Expenses</a>
                </div>
            </div>
            
            <div class="guide-step">
                <div class="step-number">4</div>
                <div class="step-content">
                    <h4>Monitor & Adjust</h4>
                    <p>Regularly review your budget performance and adjust amounts or categories as your business needs change.</p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .budget-page {
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
    
    .budget-overview {
        margin-bottom: 2rem;
    }
    
    .overview-card h4 {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .overview-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .overview-note {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .budget-categories-section {
        margin-bottom: 2rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h3 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .add-budget-form {
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }
    
    .form-input,
    .form-select {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.875rem;
    }
    
    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: var(--accent-color);
    }
    
    .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    
    .performance-section {
        margin-bottom: 2rem;
    }
    
    .performance-section h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .performance-section p {
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
    }
    
    .alerts-section {
        margin-bottom: 2rem;
    }
    
    .alerts-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        color: var(--warning-color);
    }
    
    .alerts-header h3 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .alerts-content {
        margin-bottom: 2rem;
    }
    
    .alert-settings h4 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .settings-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .setting-item label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        cursor: pointer;
    }
    
    .guide-section {
        margin-top: 2rem;
    }
    
    .guide-section h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .guide-section p {
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
    }
    
    .guide-steps {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .guide-step {
        display: flex;
        gap: 1rem;
    }
    
    .step-number {
        width: 32px;
        height: 32px;
        background-color: var(--accent-color);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .step-content h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .step-content p {
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
    
    @media (max-width: 768px) {
        .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }
        
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .form-actions {
            justify-content: stretch;
        }
        
        .form-actions .btn {
            flex: 1;
        }
    }
</style>
