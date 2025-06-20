<script>
    import { TrendingUp } from 'lucide-svelte';
    
    export let title = 'Cost Trends';
    export let data = [];
    export let loading = false;
    export let error = null;
    export let chartType = 'line'; // 'line', 'bar'
    
    // Find max value for scaling
    $: maxValue = data.length > 0 ? Math.max(...data.map(d => d.value || 0)) : 0;
</script>

<div class="cost-chart card">
    <div class="chart-header">
        <TrendingUp size={24} />
        <h3>{title}</h3>
    </div>
    
    {#if error}
        <div class="error-state">
            <p>Unable to load chart data</p>
            <small>{error}</small>
        </div>
    {:else if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading chart data...</p>
        </div>
    {:else if data.length === 0}
        <div class="empty-state">
            <h4>No chart data available</h4>
            <p>Upload your cost data to see trend analysis</p>
        </div>
    {:else}
        <div class="chart-container">
            <div class="chart-area">
                {#if chartType === 'line'}
                    <svg class="line-chart" viewBox="0 0 400 200">
                        <!-- Grid lines -->
                        <defs>
                            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="var(--border-color)" stroke-width="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)"/>
                        
                        <!-- Data line -->
                        {#if data.length > 1}
                            <polyline
                                fill="none"
                                stroke="var(--accent-color)"
                                stroke-width="2"
                                points={data.map((d, i) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 200 - ((d.value || 0) / maxValue) * 180;
                                    return `${x},${y}`;
                                }).join(' ')}
                            />
                            
                            <!-- Data points -->
                            {#each data as point, i}
                                <circle
                                    cx={(i / (data.length - 1)) * 400}
                                    cy={200 - ((point.value || 0) / maxValue) * 180}
                                    r="4"
                                    fill="var(--accent-color)"
                                />
                            {/each}
                        {/if}
                    </svg>
                {:else}
                    <div class="bar-chart">
                        {#each data as point, i}
                            <div class="bar-item">
                                <div 
                                    class="bar"
                                    style="height: {maxValue > 0 ? ((point.value || 0) / maxValue) * 100 : 0}%"
                                ></div>
                                <div class="bar-label">{point.label}</div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            
            <div class="chart-legend">
                {#each data as point, i}
                    <div class="legend-item">
                        <span class="legend-label">{point.label}:</span>
                        <span class="legend-value">${point.value?.toLocaleString() || '0'}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .chart-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        color: var(--accent-color);
    }
    
    .chart-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
    }
    
    .chart-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .chart-area {
        min-height: 200px;
    }
    
    .line-chart {
        width: 100%;
        height: 200px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
    }
    
    .bar-chart {
        display: flex;
        align-items: end;
        gap: 0.5rem;
        height: 200px;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
    }
    
    .bar-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .bar {
        width: 100%;
        background-color: var(--accent-color);
        border-radius: 2px 2px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
    }
    
    .bar-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-align: center;
    }
    
    .chart-legend {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .legend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
    }
    
    .legend-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .legend-value {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
        color: var(--text-secondary);
    }
    
    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
