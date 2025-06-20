<script>
    import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-svelte';
    import CostCard from '$lib/components/CostCard.svelte';
    import ExpenseBreakdown from '$lib/components/ExpenseBreakdown.svelte';
    import CostChart from '$lib/components/CostChart.svelte';
</script>

<svelte:head>
    <title>Dashboard - CostAnalyzer</title>
</svelte:head>

<div class="dashboard">
    <div class="dashboard-header">
        <h1>Cost Analysis Dashboard</h1>
        <p>Monitor and analyze your business costs in real-time</p>
    </div>
    
    <!-- Cost Overview Cards -->
    <div class="grid grid-4">
        <CostCard 
            title="Total Expenses" 
            value=""
            icon={DollarSign}
            error="No expense data available. Please upload your cost data to see metrics."
        />
        <CostCard 
            title="Monthly Budget" 
            value=""
            icon={Target}
            error="No budget data configured. Set up your budget in the Budget Planning section."
        />
        <CostCard 
            title="Cost Savings" 
            value=""
            icon={TrendingDown}
            error="No savings data available. Upload historical data to track savings."
        />
        <CostCard 
            title="Growth Rate" 
            value=""
            icon={TrendingUp}
            error="Insufficient data for growth calculation. Need multiple periods of data."
        />
    </div>
    
    <!-- Charts and Analysis -->
    <div class="grid grid-2">
        <CostChart 
            title="Monthly Cost Trends"
            data={[]}
            error="No trend data available. Upload your cost data to see monthly trends."
        />
        <ExpenseBreakdown 
            categories={[]}
            error="No expense categories found. Upload detailed expense data to see breakdown."
        />
    </div>
    
    <!-- Getting Started Section -->
    <div class="getting-started card">
        <h2>Getting Started with CostAnalyzer</h2>
        <p>To start analyzing your costs, you'll need to upload your financial data. Here's how:</p>
        
        <div class="steps-grid">
            <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h4>Upload Data</h4>
                    <p>Go to the Upload section and upload your cost data files (CSV, Excel)</p>
                    <a href="/upload" class="btn btn-secondary">Upload Now</a>
                </div>
            </div>
            
            <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h4>Set Budget</h4>
                    <p>Configure your budget limits and categories in Budget Planning</p>
                    <a href="/budget" class="btn btn-secondary">Set Budget</a>
                </div>
            </div>
            
            <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h4>Analyze</h4>
                    <p>View detailed analytics and insights about your cost patterns</p>
                    <a href="/analytics" class="btn btn-secondary">View Analytics</a>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .dashboard {
        max-width: 1200px;
    }
    
    .dashboard-header {
        margin-bottom: 2rem;
    }
    
    .dashboard-header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .dashboard-header p {
        font-size: 1.125rem;
        color: var(--text-secondary);
    }
    
    .getting-started {
        margin-top: 2rem;
    }
    
    .getting-started h2 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .getting-started p {
        margin-bottom: 2rem;
        color: var(--text-secondary);
    }
    
    .steps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    
    .step-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
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
        margin-bottom: 1rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
</style>
