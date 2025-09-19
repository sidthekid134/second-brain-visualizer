// Utility functions for managing GitHub configuration
const STORAGE_KEY = 'github_config';

export const getGitHubConfig = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : { repositoryUrl: '', defaultBranch: 'main' };
    } catch (error) {
        console.error('Failed to load GitHub config:', error);
        return { repositoryUrl: '', defaultBranch: 'main' };
    }
};

export const setGitHubConfig = (config) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Failed to save GitHub config:', error);
        return false;
    }
};

export const clearGitHubConfig = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear GitHub config:', error);
        return false;
    }
};

// Validation utilities
export const isValidGitHubUrl = (url) => {
    if (!url) return true; // Empty is valid
    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    return githubUrlPattern.test(url);
};

export const isValidBranchName = (branch) => {
    if (!branch) return false;
    // Basic branch name validation - no spaces, basic git ref rules
    const branchPattern = /^[a-zA-Z0-9_\-\.\/]+$/;
    return branchPattern.test(branch) && !branch.includes('..');
};

export const formatGitHubUrl = (url) => {
    if (!url) return '';
    // Remove trailing slash if present
    return url.replace(/\/$/, '');
};

export const getRepositoryInfo = (url) => {
    if (!isValidGitHubUrl(url)) return null;

    const match = url.match(/^https:\/\/github\.com\/([\w\-\.]+)\/([\w\-\.]+)\/?$/);
    if (!match) return null;

    return {
        owner: match[1],
        repository: match[2],
        fullName: `${match[1]}/${match[2]}`
    };
};
