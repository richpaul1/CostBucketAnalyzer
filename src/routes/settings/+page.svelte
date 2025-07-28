<!-- src/routes/settings/+page.svelte -->
<script>
    import { onMount } from 'svelte';

    let accountId = '';
    let apiKey = '';
    let error = '';
    let success = '';

    // Load saved credentials on mount
    onMount(async () => {
        try {
            const response = await fetch('/api/session');
            if (response.ok) {
                const credentials = await response.json();
                accountId = credentials.accountId || '';
                apiKey = credentials.apiKey || '';
            }
        } catch (err) {
            error = 'Failed to load credentials: ' + err.message;
        }
    });

    async function saveCredentials() {
        try {
            // Validate inputs
            if (!accountId || !apiKey) {
                error = 'Please fill in both Account ID and API Key.';
                success = '';
                return;
            }

            // Save to session via API route
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId, apiKey })
            });

            if (!response.ok) {
                const { error: serverError } = await response.json();
                throw new Error(serverError || 'Failed to save credentials');
            }

            success = 'Credentials saved successfully!';
            error = '';
        } catch (err) {
            error = 'Failed to save credentials: ' + err.message;
            success = '';
        }
    }
</script>

<div class="settings-container">
    <h1>Settings</h1>
    <form on:submit|preventDefault={saveCredentials}>
        <div class="form-group">
            <label for="accountId">Account ID</label>
            <input
                id="accountId"
                type="text"
                bind:value={accountId}
                placeholder="Enter Account ID"
                class="input"
            />
        </div>
        <div class="form-group">
            <label for="apiKey">API Key</label>
            <input
                id="apiKey"
                type="password"
                bind:value={apiKey}
                placeholder="Enter API Key"
                class="input"
            />
        </div>
        {#if error}
            <p class="error">{error}</p>
        {/if}
        {#if success}
            <p class="success">{success}</p>
        {/if}
        <button type="submit" class="submit-btn">Save Credentials</button>
    </form>
</div>

<style>
    .settings-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
    }
    h1 {
        font-size: 1.5rem;
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
    }
    .form-group {
        margin-bottom: 1rem;
    }
    label {
        display: block;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    .input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-secondary);
        color: var(--text-secondary);
        font-size: 1rem;
    }
    .input:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 2px var(--accent-color);
    }
    .error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
    .success {
        color: #10b981;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
    .submit-btn {
        background-color: var(--accent-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s ease;
    }
    .submit-btn:hover {
        background-color: color-mix(in srgb, var(--accent-color) 80%, black);
    }
</style>