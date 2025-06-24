<script>
  import { onMount } from 'svelte';
  import { Graph } from '@antv/g6'; // Named import for Graph

  export let graphData;

  onMount(() => {
    const container = document.getElementById('graph-container');
    const width = container.offsetWidth;
    const height = 500;

    const graph = new Graph({
      container: 'graph-container',
      width,
      height,
      fitView: true,
      fitViewPadding: 20,
      layout: {
        type: 'dagre',
        rankdir: 'TB',
        nodesep: 40,
        ranksep: 60
      },
      defaultNode: {
        type: 'rect',
        size: [120, 40],
        style: {
          fill: '#e6f7ff',
          stroke: '#1890ff',
          radius: 5
        },
        labelCfg: {
          style: {
            fontSize: 12
          }
        }
      },
      defaultEdge: {
        type: 'polyline',
        style: {
          stroke: '#666',
          endArrow: true
        },
        labelCfg: {
          autoRotate: true,
          style: {
            fontSize: 10
          }
        }
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node']
      }
    });

    // Process data to include both hierarchy and custom links
    const nodes = graphData.nodes.map(node => ({
      ...node,
      label: node.name
    }));

    const edges = [];
    
    // Add hierarchical edges from parent relationships
    graphData.nodes.forEach(node => {
      if (node.parent) {
        edges.push({
          source: node.parent,
          target: node.id,
          type: 'hierarchy'
        });
      }
    });

    // Add custom links from the links array
    graphData.links.forEach(link => {
      edges.push({
        source: link.source,
        target: link.target,
        label: link.condition,
        style: {
          stroke: link.type === 'duplicate' ? '#ff4d4f' : '#fa8c16',
          lineDash: link.type === 'overlap' ? [5, 5] : null
        }
      });
    });

    // Use graph.read instead of graph.data
    console.log('Nodes:\n', JSON.stringify(nodes,null, 2));
    console.log('Edges:\n', JSON.stringify(edges,null, 2));
    graph.setData({ nodes, edges });
    graph.render();

    // Handle window resize
    const handleResize = () => {
      graph.changeSize(container.offsetWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      graph.destroy();
    };
  });
</script>

<style>
  .container {
    width: 100%;
    height: 500px;
    border: 1px solid #ddd;
  }
</style>

<div class="container" id="graph-container"></div>