import React from 'react';
import { getStatusIcon, getStatusColor } from './flowUtils';

/**
 * Render a form field based on UI schema definition
 */
export function renderSchemaField(fieldDef, value, onChange, options = {}) {
    const {
        planData,
        editMode = false,
        isEditing = false,
        onArrayAdd,
        onArrayRemove
    } = options;

    const isReadonly = fieldDef.readonly || !editMode || !isEditing;
    const fieldValue = value ?? fieldDef.default ?? '';

    // Readonly display
    if (isReadonly) {
        return renderReadonlyField(fieldDef, fieldValue, options);
    }

    // Editable inputs
    switch (fieldDef.type) {
        case 'text':
            return (
                <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={fieldDef.placeholder}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                    }}
                />
            );

        case 'textarea':
            return (
                <textarea
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={fieldDef.placeholder}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        resize: 'vertical'
                    }}
                />
            );

        case 'number':
            return (
                <input
                    type="number"
                    value={fieldValue}
                    onChange={(e) => onChange(Number(e.target.value) || null)}
                    min={fieldDef.min}
                    max={fieldDef.max}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                    }}
                />
            );

        case 'select':
            return (
                <select
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: 'white'
                    }}
                >
                    {!fieldDef.required && <option value="">Select...</option>}
                    {fieldDef.options?.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );

        case 'milestone_select':
            const milestones = planData?.project?.milestones || [];
            return (
                <select
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: 'white'
                    }}
                >
                    <option value="">No milestone</option>
                    {milestones.map(milestone => (
                        <option key={milestone.id} value={milestone.id}>
                            {milestone.name}
                        </option>
                    ))}
                </select>
            );

        case 'agent_select':
            const agents = planData?.agents || [];
            return (
                <select
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: 'white'
                    }}
                >
                    <option value="">No agent assigned</option>
                    {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.role})
                        </option>
                    ))}
                </select>
            );

        case 'story_multiselect':
            const stories = planData?.stories || [];
            return (
                <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                }}>
                    {stories.map(story => (
                        <label key={story.id} style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            margin: '2px 0',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={(fieldValue || []).includes(story.id)}
                                onChange={(e) => {
                                    const currentValue = fieldValue || [];
                                    const newValue = e.target.checked
                                        ? [...currentValue, story.id]
                                        : currentValue.filter(id => id !== story.id);
                                    onChange(newValue);
                                }}
                                style={{ marginRight: '4px' }}
                            />
                            {story.id}: {story.objective}
                        </label>
                    ))}
                </div>
            );

        case 'array':
            const arrayValue = fieldValue || [];
            return (
                <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '8px'
                }}>
                    {arrayValue.map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                    const newArray = [...arrayValue];
                                    newArray[index] = e.target.value;
                                    onChange(newArray);
                                }}
                                placeholder={fieldDef.placeholder}
                                style={{
                                    flex: 1,
                                    padding: '4px 6px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}
                            />
                            <button
                                onClick={() => {
                                    const newArray = arrayValue.filter((_, i) => i !== index);
                                    onChange(newArray);
                                }}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onChange([...arrayValue, ''])}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                        }}
                    >
                        + Add {fieldDef.label}
                    </button>
                </div>
            );

        default:
            return (
                <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                    }}
                />
            );
    }
}

/**
 * Render readonly display of a field
 */
function renderReadonlyField(fieldDef, value, options) {
    const { uiSchema } = options;

    switch (fieldDef.type) {
        case 'select':
            if (fieldDef.key === 'status') {
                const statusConfig = uiSchema?.ui_config?.status || {};
                const color = statusConfig[value] || '#6b7280';
                const icon = uiSchema?.ui_config?.icons?.status?.[value] || '📝';

                return (
                    <div style={{
                        background: color,
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>{icon}</span>
                        {value?.replace('_', ' ')}
                    </div>
                );
            }

            const option = fieldDef.options?.find(opt => opt.value === value);
            return <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                {option?.label || value || 'Not set'}
            </span>;

        case 'milestone_select':
        case 'agent_select':
            return <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                {value || 'Not assigned'}
            </span>;

        case 'array':
            const arrayValue = value || [];
            if (arrayValue.length === 0) {
                return <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>None</span>;
            }
            return (
                <div>
                    {arrayValue.map((item, index) => (
                        <div key={index} style={{
                            fontSize: '0.75rem',
                            color: '#374151',
                            padding: '2px 0'
                        }}>
                            • {item}
                        </div>
                    ))}
                </div>
            );

        case 'story_multiselect':
            const storyIds = value || [];
            if (storyIds.length === 0) {
                return <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>None</span>;
            }
            return (
                <div>
                    {storyIds.map(storyId => (
                        <div key={storyId} style={{
                            fontSize: '0.75rem',
                            color: '#374151',
                            padding: '1px 0'
                        }}>
                            • {storyId}
                        </div>
                    ))}
                </div>
            );

        case 'number':
            return <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                {value != null ? value : 'Not set'}
            </span>;

        default:
            return <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                {value || 'Not set'}
            </span>;
    }
}

/**
 * Get nested field value from object using dot notation
 */
export function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested field value in object using dot notation
 */
export function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
    return { ...obj };
} 