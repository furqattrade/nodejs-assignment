terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    # Configure backend in terraform.tfvars or use environment variables
    # resource_group_name  = "terraform-state-rg"
    # storage_account_name = "tfstate<unique-id>"
    # container_name       = "tfstate"
    # key                  = "quotes-service.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = var.tags
}

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "${var.project_name}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = var.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = var.tags
}

# App Service for Container
resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-${var.environment}-app"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = var.environment == "production" ? true : false

    application_stack {
      docker_image_name   = "quotes-service:latest"
      docker_registry_url = "https://${azurerm_container_registry.acr.login_server}"
    }

    health_check_path = "/health"
  }

  app_settings = {
    # Docker configuration
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.acr.admin_password
    "WEBSITES_PORT"                       = "3000"

    # Application configuration
    "NODE_ENV"          = var.environment
    "PORT"              = "3000"
    "HOST"              = "0.0.0.0"
    "LOG_LEVEL"         = var.log_level
    "QUOTES_API_URL"    = var.quotes_api_url
    "ALLOWED_ORIGINS"   = var.allowed_origins
    "RATE_LIMIT_MAX"    = var.rate_limit_max
    "RATE_LIMIT_WINDOW" = var.rate_limit_window
  }

  https_only = true

  tags = var.tags
}
