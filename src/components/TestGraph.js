import React from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

const testNodes = [
    {
        id: '1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test Node 1' },
    },
    {
        id: '2',
        type: 'default',
        position: { x: 300, y: 100 },
        data: { label: 'Test Node 2' },
    },
];

const testEdges = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
    },
];

const TestGraph = () => {
    console.log('TestGraph - Rendering with test nodes');

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={testNodes}
                edges={testEdges}
                fitView
            >
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
};

export default TestGraph; 