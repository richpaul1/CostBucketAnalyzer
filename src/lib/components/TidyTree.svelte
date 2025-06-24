<script>
    import { onMount, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';

    export let graphData = { nodes: [], links: [] };
    let svgContainer;
    let d3 = null;
    let currentHighlight = null;
    let currentRootId = null;
    let width = 800;
    let showConflictsOnly = true;
    const aspectRatio = 600 / 800;
    const collapseState = writable(new Map());

    onMount(async () => {
        if (typeof window !== 'undefined') {
            d3 = await import('d3');
            graphData.nodes.forEach(node => {
                collapseState.update(map => {
                    map.set(node.id, node.collapsed || false);
                    return map;
                });
            });
            updateDimensions();
            renderTidyTree();
            d3.select(svgContainer).call(d3.zoom().transform, d3.zoomIdentity);
            window.addEventListener('resize', updateDimensions);
            setTimeout(() => {
                const nodeTexts = document.querySelectorAll('.node text');
                nodeTexts.forEach((text, i) => {
                    console.log(`Node text ${i}:`, {
                        textContent: text.textContent,
                        inlineFill: text.getAttribute('fill'),
                        computedFill: window.getComputedStyle(text).fill
                    });
                });
            }, 100);
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', updateDimensions);
        }
        if (svgContainer && d3) {
            d3.select(svgContainer).selectAll('*').remove();
        }
    });

    $: if (d3 && graphData.nodes.length) {
        renderTidyTree();
    }

    function updateDimensions() {
        if (svgContainer && typeof window !== 'undefined') {
            const parent = svgContainer.parentElement;
            if (parent) {
                width = parent.getBoundingClientRect().width;
                renderTidyTree();
            }
        }
    }

    function resetZoom() {
        if (!svgContainer || !d3) return;
        d3.select(svgContainer)
            .transition()
            .duration(500)
            .call(d3.zoom().transform, d3.zoomIdentity);
    }

    function resetRoot() {
        currentRootId = null;
        console.log('Reset to original root');
        renderTidyTree();
    }

    function setRoot(id) {
        if (nodeMap.has(id)) {
            currentRootId = id;
            console.log(`Set root to: ${nodeMap.get(id).name} (ID: ${id})`);
            renderTidyTree();
        } else {
            console.warn(`Invalid root ID: ${id}`);
        }
    }

    function toggleConflictsOnly() {
        showConflictsOnly = !showConflictsOnly;
        console.log('Show conflicts only:', showConflictsOnly);
        renderTidyTree();
    }

    function exportSVG() {
        if (!svgContainer || !d3) return;
        const svgData = new XMLSerializer().serializeToString(svgContainer);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tidy-tree.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    let nodeMap;

    function renderTidyTree() {
        if (!svgContainer || !graphData.nodes.length || !d3) return;

        d3.select(svgContainer).selectAll('*').remove();

        const height = width * aspectRatio;
        const margin = { top: 80, right: Math.max(120, width * 0.1), bottom: 20, left: Math.max(120, width * 0.1) };

        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', e => d3.select(svgContainer).select('.tree-group').attr('transform', e.transform));

        const svg = d3.select(svgContainer)
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .call(zoom)
            .on('dblclick.zoom', () => {
                d3.select(svgContainer)
                    .transition()
                    .call(zoom.scaleBy, 1.2);
            });

        svg.append('rect')
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'var(--bg-secondary, #f3f4f6)')
            .on('click', () => {
                currentHighlight = null;
                updateHighlights();
            });

        const legend = svg.append('g')
            .attr('transform', `translate(20, 20)`);
        legend.append('text')
            .attr('x', 0).attr('y', 0).attr('dy', '.35em')
            .attr('fill', '#ffbb33')
            .text('Overlap Node');
        legend.append('text')
            .attr('x', 0).attr('y', 20).attr('dy', '.35em')
            .attr('fill', '#ff4444')
            .text('Duplicate Node');
        legend.append('line')
            .attr('x1', 0).attr('x2', 20).attr('y1', 40).attr('y2', 40)
            .attr('stroke', '#ccc').attr('stroke-width', 2);
        legend.append('text')
            .attr('x', 25).attr('y', 40).attr('dy', '.35em')
            .attr('fill', 'var(--accent-color, #2563eb)')
            .text('Tree Link');

        svg.append('g')
            .attr('transform', `translate(20, 60)`)
            .append('foreignObject')
            .attr('width', 80)
            .attr('height', 30)
            .append('xhtml:button')
            .style('padding', '5px 10px')
            .style('background', 'var(--accent-color, #2563eb)')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '0.9rem')
            .on('click', resetRoot)
            .text('Reset Root');

        svg.append('g')
            .attr('transform', `translate(100, 60)`)
            .append('foreignObject')
            .attr('width', 120)
            .attr('height', 30)
            .append('xhtml:button')
            .style('padding', '5px 10px')
            .style('background', 'var(--accent-color, #2563eb)')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '0.9rem')
            .on('click', toggleConflictsOnly)
            .text(() => showConflictsOnly ? 'Show All Nodes' : 'Show Conflicts Only');

        nodeMap = new Map();
        graphData.nodes.forEach(node => {
            nodeMap.set(node.id, { ...node });
        });

        const conflictNodeIds = new Set();
        graphData.links.forEach(link => {
            if (link.type === 'duplicate' || link.type === 'overlap') {
                conflictNodeIds.add(link.source);
                conflictNodeIds.add(link.target);
            }
        });

        let subtreeNodes = graphData.nodes;
        let subtreeLinks = graphData.links;
        let nodesToInclude = new Set(graphData.nodes.map(n => n.id));

        if (showConflictsOnly) {
            nodesToInclude = new Set(conflictNodeIds);
            conflictNodeIds.forEach(id => {
                let currentId = id;
                while (currentId) {
                    nodesToInclude.add(currentId);
                    const node = nodeMap.get(currentId);
                    currentId = node ? node.parent : null;
                }
            });
            subtreeNodes = graphData.nodes.filter(n => nodesToInclude.has(n.id));
            subtreeLinks = graphData.links.filter(l => nodesToInclude.has(l.source) && nodesToInclude.has(l.target));
        }

        console.log('Nodes to include:', Array.from(nodesToInclude).length, 'Show conflicts only:', showConflictsOnly);

        if (currentRootId && nodeMap.has(currentRootId)) {
            const descendants = new Set([currentRootId]);
            function collectDescendants(id) {
                subtreeNodes.forEach(n => {
                    if (n.parent === id) {
                        descendants.add(n.id);
                        collectDescendants(n.id);
                    }
                });
            }
            collectDescendants(currentRootId);
            subtreeNodes = subtreeNodes
                .filter(n => descendants.has(n.id))
                .map(node => ({
                    ...node,
                    parent: node.id === currentRootId ? null : node.parent
                }));
            subtreeLinks = subtreeLinks.filter(l => descendants.has(l.source) && descendants.has(l.target));
        }

        console.log('Subtree nodes:', subtreeNodes.length, subtreeNodes.map(n => ({ id: n.id, name: n.name, parent: n.parent })));
        console.log('Subtree links:', subtreeLinks.length);

        if (currentRootId && nodeMap.has(currentRootId)) {
            const path = [];
            let currentId = currentRootId;
            while (currentId) {
                const node = nodeMap.get(currentId);
                if (node && (showConflictsOnly ? nodesToInclude.has(node.id) : true)) {
                    path.unshift({ id: node.id, name: node.name });
                    currentId = node.parent;
                } else {
                    break;
                }
            }
            console.log('Breadcrumb path:', path.map(p => p.name));
            const breadcrumbGroup = svg.append('g')
                .attr('transform', `translate(230, 60)`);
            let xOffset = 0;
            path.forEach((p, i) => {
                breadcrumbGroup.append('text')
                    .attr('x', xOffset)
                    .attr('dy', '.35em')
                    .attr('fill', 'var(--accent-color, #2563eb)')
                    .attr('cursor', 'pointer')
                    .text(p.name)
                    .on('click', () => setRoot(p.id));
                xOffset += p.name.length * 8 + 20;
                if (i < path.length - 1) {
                    breadcrumbGroup.append('text')
                        .attr('x', xOffset - 15)
                        .attr('dy', '.35em')
                        .attr('fill', 'var(--accent-color, #2563eb)')
                        .text('>');
                }
            });
        }

        const g = svg.append('g')
            .attr('class', 'tree-group')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        if (!subtreeNodes.length) {
            console.error('No valid subtree nodes to render');
            return;
        }

        let root;
        try {
            root = d3.stratify()
                .id(d => d.id)
                .parentId(d => d.parent)(subtreeNodes);
            root.descendants().forEach(d => {
                d.data.collapsed = false; // Disable collapse
            });
        } catch (e) {
            console.error('Stratify error:', e.message, {
                subtreeNodes: subtreeNodes.map(n => ({ id: n.id, name: n.name, parent: n.parent })),
                currentRootId
            });
            try {
                root = d3.stratify()
                    .id(d => d.id)
                    .parentId(d => d.parent)(graphData.nodes.filter(n => showConflictsOnly ? nodesToInclude.has(n.id) : true));
                currentRootId = null;
            } catch (fallbackError) {
                console.error('Fallback stratify error:', fallbackError.message);
                return;
            }
        }

        function getVisibleNodes(rootNode) {
            const visibleNodes = [];
            function traverse(node) {
                visibleNodes.push(node);
                if (node.children) {
                    node.children.forEach(child => traverse(child));
                }
            }
            traverse(rootNode);
            return visibleNodes;
        }

        const visibleNodes = getVisibleNodes(root);
        console.log('Visible nodes:', visibleNodes.length, visibleNodes.map(n => n.data.name));

        const tree = d3.tree();
        tree(root);
        const xExtent = d3.extent(visibleNodes, d => d.x);
        const yExtent = d3.extent(visibleNodes, d => d.y);
        const treeWidth = yExtent[1] - yExtent[0] || 1;
        const treeHeight = xExtent[1] - xExtent[0] || 1;
        const availableWidth = width - margin.left - margin.right;
        const availableHeight = height - margin.top - margin.bottom;
        const scaleX = availableHeight / treeHeight;
        const scaleY = availableWidth / treeWidth;
        const scale = Math.min(scaleX, scaleY, 1);
        tree.size([availableHeight * scale, availableWidth * scale]);
        tree(root);

        const newXExtent = d3.extent(visibleNodes, d => d.x);
        const newYExtent = d3.extent(visibleNodes, d => d.y);
        const translateX = -newYExtent[0];
        const translateY = -newXExtent[0] + availableHeight * (1 - scale) / 2;
        g.attr('transform', `translate(${margin.left + translateY},${margin.top + translateX})`);

        const duplicateNodes = new Set();
        const overlapNodes = new Set();
        subtreeLinks.forEach(link => {
            if (link.type === 'duplicate') {
                duplicateNodes.add(link.source);
                duplicateNodes.add(link.target);
            } else if (link.type === 'overlap') {
                overlapNodes.add(link.source);
                overlapNodes.add(link.target);
            }
        });

        const visibleLinks = root.links().filter(link => 
            visibleNodes.includes(link.source) && visibleNodes.includes(link.target)
        );

        g.selectAll('.link')
            .data(visibleLinks)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 2)
            .attr('opacity', 1);

        const node = g.selectAll('.node')
            .data(visibleNodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', (e, d) => {
                console.log(`Clicked node: ${d.data.name} (ID: ${d.id})`);
                if (d.id === currentRootId || !d.children) {
                    currentHighlight = d.id;
                    updateHighlights();
                } else {
                    setRoot(d.id);
                }
                renderTidyTree();
                e.stopPropagation();
            });

        node.append('circle')
            .attr('r', 7)
            .attr('fill', d => d.id === currentRootId ? '#555' : '#999')
            .on('mouseover', function () { d3.select(this).attr('fill', 'var(--accent-color, #2563eb)'); })
            .on('mouseout', function () { d3.select(this).attr('fill', d => d.id === currentRootId ? '#555' : '#999'); });

        node.append('text')
            .attr('dy', '.35em')
            .attr('x', 12)
            .attr('text-anchor', 'start')
            .attr('fill', d => {
                if (duplicateNodes.has(d.id)) return '#ff4444';
                if (overlapNodes.has(d.id)) return '#ffbb33';
                return 'var(--accent-color, #2563eb)';
            })
            .text(d => d.data.name);

        node.append('title')
            .text(d => {
                const conflicts = subtreeLinks.filter(l => l.source === d.id || l.target === d.id);
                if (conflicts.length) {
                    return conflicts.map(link => {
                        const sourceNode = nodeMap.get(link.source);
                        const targetNode = nodeMap.get(link.target);
                        const sourceCategory = sourceNode.parent 
                            ? nodeMap.get(sourceNode.parent)?.name || 'Unknown' 
                            : 'None';
                        return `[${link.type}] ${sourceCategory} → ${targetNode.name}: ${link.condition}`;
                    }).join('\n');
                }
                return 'No conflicts';
            });

        svg.append('g')
            .attr('transform', `translate(${width - 100}, ${height + margin.top - 40})`)
            .append('foreignObject')
            .attr('width', 80)
            .attr('height', 30)
            .append('xhtml:button')
            .style('padding', '5px 10px')
            .style('background', 'var(--accent-color, #2563eb)')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '0.9rem')
            .on('click', resetZoom)
            .text('Reset Zoom');

        svg.append('g')
            .attr('transform', `translate(${width - 200}, ${height + margin.top - 40})`)
            .append('foreignObject')
            .attr('width', 80)
            .attr('height', 30)
            .append('xhtml:button')
            .style('padding', '5px 10px')
            .style('background', 'var(--accent-color, #2563eb)')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '0.9rem')
            .on('click', exportSVG)
            .text('Export SVG');

        function updateHighlights() {
            node.attr('opacity', d => currentHighlight && d.id !== currentHighlight ? 0.2 : 1);
            g.selectAll('.link').attr('opacity', currentHighlight ? 0.2 : 1);
        }
    }
</script>

<svg bind:this={svgContainer}></svg>

<style>
    svg {
        display: block;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
    }

    :global([data-theme='dark'] .node text:not([fill="#ff4444"]):not([fill="#ffbb33"])) {
        fill: #fff !important;
    }

    :global([data-theme='dark'] .legend text:not([fill="#ff4444"]):not([fill="#ffbb33"])) {
        fill: #fff !important;
    }

    :global([data-theme='dark'] g text:not([fill="#ff4444"]):not([fill="#ffbb33"])) {
        fill: #fff !important;
    }
</style>