#!/bin/bash

# Demo script to showcase different authentication configurations
# This demonstrates how federation operators would deploy the same codebase
# with completely different authentication experiences

set -e

echo "🚀 OIDFED Registry Authentication Demonstration"
echo "=============================================="
echo ""
echo "This demo shows how federation operators can deploy the same codebase"
echo "with different authentication methods by simply changing environment variables."
echo ""

# Function to show configuration
show_config() {
    echo "📋 Current Configuration:"
    echo "   NODE_ENV: ${NODE_ENV:-not set}"
    echo "   VITE_APP_NAME: ${VITE_APP_NAME:-not set}"
    echo "   Auth Method: $1"
    echo "   Expected UX: $2"
    echo ""
}

# Function to start demo server
start_demo() {
    echo "🌐 Starting demo server..."
    echo "   Open: http://localhost:3000"
    echo "   Press Ctrl+C to stop and return to menu"
    echo ""
    bun --hot src/index.ts
}

# Clean environment function
clean_env() {
    unset NODE_ENV
    unset VITE_APP_NAME
    unset VITE_AUTH_OIDC_CLIENT_ID
    unset VITE_AUTH_OIDC_BASE_URL
    unset VITE_AUTH_OAUTH_CLIENT_ID
    unset VITE_AUTH_OAUTH_BASE_URL
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_API_BASE_URL
}

while true; do
    clear
    echo "🎭 OIDFED Registry - Multi-Deployment Demo"
    echo "=========================================="
    echo ""
    echo "Choose a deployment scenario to demonstrate:"
    echo ""
    echo "1) 🎓 University Deployment (OIDC SSO)"
    echo "2) 🏛️  Government Deployment (Basic Auth)"
    echo "3) 🏢 Corporate Deployment (OAuth)"
    echo "4) 🔬 Research Consortium (OIDC Federation)"
    echo "5) 🛠️  Development Environment (Dev Auth)"
    echo "6) ☁️  Multi-Tenant SaaS (Multiple Options)"
    echo ""
    echo "7) 📚 View Configuration Guide"
    echo "8) 🧪 Interactive Testing Menu"
    echo "9) 🚪 Exit Demo"
    echo ""
    read -p "Enter your choice (1-9): " choice
    echo ""

    case $choice in
        1)
            echo "🎓 UNIVERSITY DEPLOYMENT DEMO"
            echo "============================="
            echo ""
            echo "Scenario: Large university with existing OIDC infrastructure"
            echo "Target Users: Students, faculty, staff"
            echo "Auth Method: University Single Sign-On (OIDC)"
            echo ""
            
            clean_env
            export NODE_ENV=production
            export VITE_APP_NAME="University of Example Federation Registry"
            export VITE_AUTH_OIDC_CLIENT_ID=university_fed_client_2024
            export VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
            export VITE_API_BASE_URL=https://federation-api.university.edu
            
            show_config "OIDC (University SSO)" "Single 'Continue with University SSO' button, familiar university branding"
            
            echo "💡 What users see:"
            echo "   - Professional university-branded interface"
            echo "   - Single sign-on button: 'Continue with University SSO'"
            echo "   - Seamless redirect to familiar university login"
            echo "   - No technical configuration visible to end users"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        2)
            echo "🏛️ GOVERNMENT DEPLOYMENT DEMO"
            echo "============================="
            echo ""
            echo "Scenario: Secure government environment requiring basic auth"
            echo "Target Users: Government officials, contractors"
            echo "Auth Method: Secure username/password (Basic Auth)"
            echo ""
            
            clean_env
            export NODE_ENV=production
            export VITE_APP_NAME="Government Federation Authority"
            export VITE_AUTH_BASIC_ENDPOINT=https://secure.gov.agency/federation/auth/login
            export VITE_API_BASE_URL=https://secure.gov.agency/federation/api
            
            show_config "Basic Auth (Government)" "Professional username/password form with government-grade security"
            
            echo "💡 What users see:"
            echo "   - Formal, professional government interface"
            echo "   - Clean username/password login form"
            echo "   - Security-focused messaging"
            echo "   - Employee ID format validation"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        3)
            echo "🏢 CORPORATE DEPLOYMENT DEMO"
            echo "============================"
            echo ""
            echo "Scenario: Tech company with OAuth identity provider"
            echo "Target Users: Company employees"  
            echo "Auth Method: Corporate OAuth integration"
            echo ""
            
            clean_env
            export NODE_ENV=production
            export VITE_APP_NAME="TechCorp Identity Federation"
            export VITE_AUTH_OAUTH_CLIENT_ID=techcorp_fed_app_v2
            export VITE_AUTH_OAUTH_BASE_URL=https://identity.techcorp.com
            export VITE_API_BASE_URL=https://federation.internal.techcorp.com
            
            show_config "OAuth (Corporate)" "Company-branded SSO with familiar corporate identity"
            
            echo "💡 What users see:"
            echo "   - Corporate-branded interface with company colors"
            echo "   - 'Continue with TechCorp SSO' button"
            echo "   - Integration with existing corporate identity"
            echo "   - Employee-familiar authentication flow"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        4)
            echo "🔬 RESEARCH CONSORTIUM DEMO"
            echo "==========================="
            echo ""
            echo "Scenario: Multi-organization research federation"
            echo "Target Users: Researchers from multiple institutions"
            echo "Auth Method: Federated OIDC across institutions"
            echo ""
            
            clean_env
            export NODE_ENV=production
            export VITE_APP_NAME="Global Research Federation"
            export VITE_AUTH_OIDC_CLIENT_ID=research_fed_consortium_2024
            export VITE_AUTH_OIDC_BASE_URL=https://identity.research-federation.org
            export VITE_API_BASE_URL=https://api.research-federation.org
            
            show_config "OIDC (Research Federation)" "Academic-friendly cross-institutional authentication"
            
            echo "💡 What users see:"
            echo "   - Academic-oriented interface design"
            echo "   - 'Continue with Research Federation' button"
            echo "   - Cross-institutional collaboration support"
            echo "   - Institution selection and routing"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        5)
            echo "🛠️ DEVELOPMENT ENVIRONMENT DEMO"
            echo "==============================="
            echo ""
            echo "Scenario: Local development and testing"
            echo "Target Users: Developers, testers"
            echo "Auth Method: Development bypass (any credentials work)"
            echo ""
            
            clean_env
            export NODE_ENV=development
            export VITE_APP_NAME="OIDFED Registry (Development)"
            
            show_config "Development Auth" "Any credentials work, clear development indicators"
            
            echo "💡 What developers see:"
            echo "   - Clear '(Development)' indicators everywhere"
            echo "   - Any username/password combination works"
            echo "   - Default credentials: admin/admin"
            echo "   - Helpful testing and debugging information"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        6)
            echo "☁️ MULTI-TENANT SAAS DEMO"
            echo "========================="
            echo ""
            echo "Scenario: Hosted federation service for multiple customers"
            echo "Target Users: Various customer types"
            echo "Auth Method: Multiple methods available per customer"
            echo ""
            
            clean_env
            export NODE_ENV=production
            export VITE_APP_NAME="Hosted Federation Service"
            export VITE_AUTH_BASIC_ENDPOINT=https://api.federation-saas.com/auth/login
            export VITE_AUTH_OAUTH_CLIENT_ID=saas_oauth_client
            export VITE_AUTH_OAUTH_BASE_URL=https://oauth.federation-saas.com
            export VITE_API_BASE_URL=https://api.federation-saas.com
            
            show_config "Multi-Method (SaaS)" "Professional interface with multiple authentication options"
            
            echo "💡 What customers see:"
            echo "   - Professional SaaS-grade interface"
            echo "   - Multiple authentication method choices"
            echo "   - Tenant-specific branding capabilities"
            echo "   - Scalable multi-customer architecture"
            echo ""
            
            read -p "Press Enter to start demo server..."
            start_demo
            ;;
            
        7)
            echo "📚 CONFIGURATION GUIDE"
            echo "====================="
            echo ""
            echo "Opening detailed configuration guide..."
            echo ""
            
            if command -v code &> /dev/null; then
                code src/auth/DEPLOYMENT-CONFIGS.md
            elif command -v open &> /dev/null; then
                open src/auth/DEPLOYMENT-CONFIGS.md
            else
                echo "View the file: src/auth/DEPLOYMENT-CONFIGS.md"
            fi
            
            read -p "Press Enter to continue..."
            ;;
            
        8)
            echo "🧪 INTERACTIVE TESTING MENU"
            echo "==========================="
            echo ""
            echo "Opening interactive testing script..."
            echo ""
            ./test-auth.sh
            ;;
            
        9)
            echo "👋 Thanks for exploring OIDFED Registry authentication!"
            echo ""
            echo "🎯 Key Takeaways:"
            echo "   • Same codebase = Multiple deployment scenarios"
            echo "   • Environment variables = Zero-configuration auth selection"
            echo "   • Federation operators = Invisible technical complexity"
            echo "   • Users see = Familiar, branded authentication experiences"
            echo ""
            echo "📖 Next Steps:"
            echo "   • Review: src/auth/DEPLOYMENT-CONFIGS.md"
            echo "   • Test: ./test-auth.sh"
            echo "   • Deploy: Choose your scenario and set environment variables"
            echo ""
            clean_env
            exit 0
            ;;
            
        *)
            echo "❌ Invalid choice. Please enter 1-9."
            read -p "Press Enter to continue..."
            ;;
    esac
done