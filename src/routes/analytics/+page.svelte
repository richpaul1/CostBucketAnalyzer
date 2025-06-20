<script>
    import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-svelte';
    import CostChart from '$lib/components/CostChart.svelte';
    import ExpenseBreakdown from '$lib/components/ExpenseBreakdown.svelte';
    import CostCard from '$lib/components/CostCard.svelte';
</script>

<svelte:head>
    <title>Analytics - CostAnalyzer</title>
</svelte:head>

<div class="analytics-page">
    <div class="page-header">
        <BarChart3 size={32} />
        <div>
            <h1>Cost Analytics</h1>
            <p>Detailed analysis and insights into your cost patterns</p>
        </div>
    </div>
    
    <!-- Quick Metrics -->
    <div class="grid grid-4">
        <CostCard 
            title="Average Monthly Cost" 
            value=""
            icon={TrendingUp}
            error="No data available for monthly averages"
        />
        <CostCard 
            title="Highest Expense Category" 
            value=""
            icon={PieChart}
            error="No category data available"
        />
        <CostCard 
            title="Cost Variance" 
            value=""
            icon={BarChart3}
            error="Insufficient data for variance calculation"
        />
        <CostCard 
            title="Analysis Period" 
            value=""
            icon={Calendar}
            error="No time period data available"
        />
    </div>
    
    <!-- Detailed Charts -->
    <div class="charts-section">
        <div class="chart-row">
            <CostChart 
                title="Cost Trends Over Time"
                data={[]}
                chartType="line"
                error="No time series data available. Upload historical cost data to see trends."
            />
        </div>
        
        <div class="chart-row grid-2">
            <CostChart 
                title="Monthly Comparison"
                data={[]}
                chartType="bar"
                error="No monthly data available for comparison."
            />
            <ExpenseBreakdown 
                categories={[]}
                error="No expense categories found. Upload detailed expense data to see breakdown by category."
            />
        </div>
    </div>
    
    <!-- Analysis Insights -->
    <div class="insights-section">
        <div class="insights-header">
            <h2>Analysis Insights</h2>
            <p>AI-powered insights based on your cost data</p>
        </div>
        
        <div class="insights-grid">
            <div class="insight-card card">
                <h4>Cost Optimization Opportunities</h4>
                <div class="empty-state">
                    <p>No data available for optimization analysis</p>
                    <small>Upload your cost data to receive personalized optimization recommendations</small>
                </div>
            </div>
            
            <div class="insight-card card">
                <h4>Spending Patterns</h4>
                <div class="empty-state">
                    <p>No spending patterns identified</p>
                    <small>Historical data needed to identify recurring spending patterns</small>
                </div>
            </div>
            
            <div class="insight-card card">
                <h4>Budget Performance</h4>
                <div class="empty-state">
                    <p>No budget comparison available</p>
                    <small>Set up budgets and upload actual spending data for performance analysis</small>
                </div>
            </div>
            
            <div class="insight-card card">
                <h4>Cost Forecasting</h4>
                <div class="empty-state">
                    <p>Insufficient data for forecasting</p>
                    <small>At least 6 months of historical data required for accurate forecasting</small>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Action Items -->
    <div class="actions-section card">
        <h3>Recommended Actions</h3>
        <p>To get meaningful analytics, consider these next steps:</p>
        
        <div class="action-list">
            <div class="action-item">
                <div class="action-icon">1</div>
                <div class="action-content">
                    <h4>Upload Historical Data</h4>
                    <p>Upload at least 3 months of cost data for basic trend analysis</p>
                    <a href="/upload" class="btn btn-secondary">Upload Data</a>
                </div>
            </div>
            
            <div class="action-item">
                <div class="action-icon">2</div>
                <div class="action-content">
                    <h4>Configure Budget Categories</h4>
                    <p>Set up your budget categories to track performance against targets</p>
                    <a href="/budget" class="btn btn-secondary">Set Budget</a>
                </div>
            </div>
            
            <div class="action-item">
                <div class="action-icon">3</div>
                <div class="action-content">
                    <h4>Categorize Expenses</h4>
                    <p>Ensure your expense data includes proper categorization for detailed analysis</p>
                    <a href="/expenses" class="btn btn-secondary">View Expenses</a>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .analytics-page {
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
    
    .charts-section {
        margin: 2rem 0;
    }
    
    .chart-row {
        margin-bottom: 2rem;
    }
    
    .insights-section {
        margin: 2rem 0;
    }
    
    .insights-header {
        margin-bottom: 1.5rem;
    }
    
    .insights-header h2 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .insights-header p {
        color: var(--text-secondary);
    }
    
    .insights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .insight-card h4 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .actions-section {
        margin-top: 2rem;
    }
    
    .actions-section h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .actions-section p {
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
    }
    
    .action-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .action-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
    }
    
    .action-icon {
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
    
    .action-content {
        flex: 1;
    }
    
    .action-content h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .action-content p {
        margin-bottom: 1rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
</style>
