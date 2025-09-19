export const APP_TEXTS = {

  APP_NAME: 'Market Research Tool',
  APP_DESCRIPTION: 'AI-powered market research and analysis platform',
  APP_VERSION: '1.0.0',
  APP_AUTHOR: 'Market Research Team',

  NAV: {
    HOME: 'Home',
    DASHBOARD: 'Dashboard',
    REPORTS: 'Reports',
    ANALYTICS: 'Analytics',
    COLLABORATION: 'Collaboration',
    SETTINGS: 'Settings',
    HELP: 'Help',
    LOGOUT: 'Logout',
  },

  DASHBOARD: {
    TITLE: 'Market Research Dashboard',
    SUBTITLE: 'Comprehensive market analysis and insights',
    WELCOME: 'Welcome to your market research dashboard',
    QUICK_ACTIONS: 'Quick Actions',
    RECENT_REPORTS: 'Recent Reports',
    ANALYTICS_OVERVIEW: 'Analytics Overview',
    TEAM_ACTIVITY: 'Team Activity',
  },

  RESEARCH_TYPES: {
    MARKET_TRENDS: {
      LABEL: 'Market Trends',
      DESCRIPTION: 'Analyze current market trends and patterns',
      ICON: '📈',
    },
    COMPETITIVE_ANALYSIS: {
      LABEL: 'Competitive Analysis',
      DESCRIPTION: 'Study competitors and market positioning',
      ICON: '🏆',
    },
    TREND_FORECASTING: {
      LABEL: 'Trend Forecasting',
      DESCRIPTION: 'Predict future market developments',
      ICON: '🔮',
    },
    CONSUMER_BEHAVIOR: {
      LABEL: 'Consumer Behavior',
      DESCRIPTION: 'Analyze customer preferences and behavior',
      ICON: '👥',
    },
    MARKET_SIZE: {
      LABEL: 'Market Size',
      DESCRIPTION: 'Calculate market size and growth potential',
      ICON: '📊',
    },
    INVESTMENT_ANALYSIS: {
      LABEL: 'Investment Analysis',
      DESCRIPTION: 'Evaluate investment opportunities and risks',
      ICON: '💰',
    },
  },

  INDUSTRIES: {
    TECHNOLOGY: {
      LABEL: 'Technology',
      DESCRIPTION: 'Software, hardware, and digital services',
      ICON: '💻',
    },
    HEALTHCARE: {
      LABEL: 'Healthcare',
      DESCRIPTION: 'Medical devices, pharmaceuticals, and services',
      ICON: '🏥',
    },
    FINANCE: {
      LABEL: 'Finance',
      DESCRIPTION: 'Banking, insurance, and financial services',
      ICON: '🏦',
    },
    RETAIL: {
      LABEL: 'Retail',
      DESCRIPTION: 'E-commerce, brick-and-mortar, and consumer goods',
      ICON: '🛍️',
    },
    AUTOMOTIVE: {
      LABEL: 'Automotive',
      DESCRIPTION: 'Vehicles, parts, and mobility services',
      ICON: '🚗',
    },
    ENERGY: {
      LABEL: 'Energy',
      DESCRIPTION: 'Oil, gas, renewable energy, and utilities',
      ICON: '⚡',
    },
    TELECOMMUNICATIONS: {
      LABEL: 'Telecommunications',
      DESCRIPTION: 'Communication networks and services',
      ICON: '📱',
    },
    TOURISM: {
      LABEL: 'Tourism',
      DESCRIPTION: 'Travel, hospitality, and leisure services',
      ICON: '✈️',
    },
    REAL_ESTATE: {
      LABEL: 'Real Estate',
      DESCRIPTION: 'Property development, management, and investment',
      ICON: '🏢',
    },
    MANUFACTURING: {
      LABEL: 'Manufacturing',
      DESCRIPTION: 'Industrial production and supply chain',
      ICON: '🏭',
    },
  },

  REGIONS: {
    MENA: {
      LABEL: 'MENA (Middle East & North Africa)',
      DESCRIPTION: 'Middle East and North Africa region',
      ICON: '🌍',
    },
    MEA: {
      LABEL: 'MEA (Middle East & Africa)',
      DESCRIPTION: 'Middle East and Africa region',
      ICON: '🌍',
    },
    NORTH_AMERICA: {
      LABEL: 'North America',
      DESCRIPTION: 'United States, Canada, and Mexico',
      ICON: '🌎',
    },
    EUROPE: {
      LABEL: 'Europe',
      DESCRIPTION: 'European Union and surrounding countries',
      ICON: '🌍',
    },
    ASIA_PACIFIC: {
      LABEL: 'Asia Pacific',
      DESCRIPTION: 'Asia, Australia, and Pacific Islands',
      ICON: '🌏',
    },
    LATIN_AMERICA: {
      LABEL: 'Latin America',
      DESCRIPTION: 'South America and Central America',
      ICON: '🌎',
    },
    AFRICA: {
      LABEL: 'Africa',
      DESCRIPTION: 'African continent',
      ICON: '🌍',
    },
  },

  TIME_FRAMES: {
    '2024-2025': {
      LABEL: '2024-2025',
      DESCRIPTION: 'Current and next year analysis',
    },
    '2024-2026': {
      LABEL: '2024-2026',
      DESCRIPTION: 'Three-year forecast',
    },
    '2025-2030': {
      LABEL: '2025-2030',
      DESCRIPTION: 'Long-term strategic outlook',
    },
  },

  FORMS: {
    RESEARCH_FORM: {
      TITLE: 'Create New Research Report',
      SUBTITLE: 'Configure your market research parameters',
      INDUSTRY_LABEL: 'Industry',
      REGION_LABEL: 'Region',
      RESEARCH_TYPE_LABEL: 'Research Type',
      TIME_FRAME_LABEL: 'Time Frame',
      ADDITIONAL_OPTIONS_LABEL: 'Additional Analysis Options',
      SUBMIT_BUTTON: '🚀 Generate Research Report',
      CANCEL_BUTTON: 'Cancel',
      RESET_BUTTON: 'Reset Form',
    },
    LOGIN_FORM: {
      TITLE: 'Sign In',
      EMAIL_LABEL: 'Email Address',
      PASSWORD_LABEL: 'Password',
      REMEMBER_ME: 'Remember me',
      FORGOT_PASSWORD: 'Forgot password?',
      SIGN_IN_BUTTON: 'Sign In',
      SIGN_UP_LINK: "Don't have an account? Sign up",
    },
    REGISTER_FORM: {
      TITLE: 'Create Account',
      NAME_LABEL: 'Full Name',
      EMAIL_LABEL: 'Email Address',
      PASSWORD_LABEL: 'Password',
      CONFIRM_PASSWORD_LABEL: 'Confirm Password',
      TERMS_AGREEMENT: 'I agree to the terms and conditions',
      SIGN_UP_BUTTON: 'Create Account',
      SIGN_IN_LINK: 'Already have an account? Sign in',
    },
  },

  MESSAGES: {
    SUCCESS: {
      REPORT_GENERATED: 'Research report generated successfully!',
      REPORT_SAVED: 'Report saved successfully',
      REPORT_SHARED: 'Report shared successfully',
      COMMENT_ADDED: 'Comment added successfully',
      ANNOTATION_ADDED: 'Annotation added successfully',
      USER_CREATED: 'User account created successfully',
      LOGIN_SUCCESS: 'Login successful',
      LOGOUT_SUCCESS: 'Logout successful',
      SETTINGS_UPDATED: 'Settings updated successfully',
    },
    ERROR: {
      REPORT_GENERATION_FAILED: 'Failed to generate research report',
      REPORT_NOT_FOUND: 'Report not found',
      PERMISSION_DENIED: 'Permission denied',
      INVALID_CREDENTIALS: 'Invalid email or password',
      EMAIL_EXISTS: 'Email already exists',
      PASSWORDS_DONT_MATCH: 'Passwords do not match',
      NETWORK_ERROR: 'Network error occurred',
      SERVER_ERROR: 'Server error occurred',
      VALIDATION_ERROR: 'Please check your input',
    },
    WARNING: {
      UNSAVED_CHANGES: 'You have unsaved changes',
      SESSION_EXPIRED: 'Your session has expired',
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later',
      DATA_OUTDATED: 'Data may be outdated',
    },
    INFO: {
      LOADING: 'Loading...',
      PROCESSING: 'Processing your request...',
      GENERATING_REPORT: 'Generating research report...',
      UPLOADING: 'Uploading file...',
      SAVING: 'Saving changes...',
      NO_DATA: 'No data available',
      NO_RESULTS: 'No results found',
    },
  },

  STATUS: {
    DRAFT: 'Draft',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  },

  CHARTS: {
    MARKET_SHARE: 'Market Share',
    REVENUE_TREND: 'Revenue Trend',
    GROWTH_RATE: 'Growth Rate',
    COMPETITOR_ANALYSIS: 'Competitor Analysis',
    CONSUMER_SENTIMENT: 'Consumer Sentiment',
    RISK_ASSESSMENT: 'Risk Assessment',
    PREDICTIONS: 'Predictions',
    TIMELINE: 'Timeline',
  },

  ANALYTICS: {
    SENTIMENT: {
      POSITIVE: 'Positive',
      NEGATIVE: 'Negative',
      NEUTRAL: 'Neutral',
      OVERALL: 'Overall Sentiment',
      CONFIDENCE: 'Confidence Level',
    },
    RISK: {
      LOW: 'Low Risk',
      MEDIUM: 'Medium Risk',
      HIGH: 'High Risk',
      CRITICAL: 'Critical Risk',
      OVERALL_RISK: 'Overall Risk Score',
    },
    PREDICTIONS: {
      TREND: 'Trend Prediction',
      PRICE: 'Price Prediction',
      DEMAND: 'Demand Prediction',
      GROWTH: 'Growth Prediction',
      CONFIDENCE: 'Prediction Confidence',
    },
  },

  COLLABORATION: {
    COMMENTS: {
      ADD_COMMENT: 'Add a comment...',
      REPLY: 'Reply',
      EDIT: 'Edit',
      DELETE: 'Delete',
      RESOLVE: 'Resolve',
      MENTION: 'Mention someone...',
    },
    ANNOTATIONS: {
      ADD_ANNOTATION: 'Add annotation',
      HIGHLIGHT: 'Highlight',
      NOTE: 'Note',
      DRAWING: 'Drawing',
      SHAPE: 'Shape',
    },
    SHARING: {
      SHARE_REPORT: 'Share Report',
      INVITE_COLLABORATOR: 'Invite Collaborator',
      SET_PERMISSIONS: 'Set Permissions',
      PUBLIC_LINK: 'Public Link',
      EXPIRES: 'Expires',
    },
  },

  SETTINGS: {
    PROFILE: {
      TITLE: 'Profile Settings',
      PERSONAL_INFO: 'Personal Information',
      PREFERENCES: 'Preferences',
      NOTIFICATIONS: 'Notifications',
      SECURITY: 'Security',
    },
    TEAM: {
      TITLE: 'Team Settings',
      MEMBERS: 'Team Members',
      ROLES: 'Roles & Permissions',
      INVITATIONS: 'Invitations',
    },
    SYSTEM: {
      TITLE: 'System Settings',
      GENERAL: 'General',
      INTEGRATIONS: 'Integrations',
      BACKUP: 'Backup & Restore',
    },
  },

  HELP: {
    GETTING_STARTED: 'Getting Started',
    USER_GUIDE: 'User Guide',
    FAQ: 'Frequently Asked Questions',
    CONTACT_SUPPORT: 'Contact Support',
    FEEDBACK: 'Send Feedback',
  },
} as const;

export const {
  APP_TEXTS: {
    NAV,
    DASHBOARD,
    RESEARCH_TYPES,
    INDUSTRIES,
    REGIONS,
    TIME_FRAMES,
    FORMS,
    MESSAGES,
    STATUS,
    CHARTS,
    ANALYTICS,
    COLLABORATION,
    SETTINGS,
    HELP,
  },
} = { APP_TEXTS };
