variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "quotes-service"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "app_service_sku" {
  description = "SKU for App Service Plan"
  type        = string
  default     = "B1"
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be debug, info, warn, or error."
  }
}

variable "quotes_api_url" {
  description = "External quotes API URL"
  type        = string
  default     = "https://api.quotable.io/quotes"
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = "*"
}

variable "rate_limit_max" {
  description = "Maximum number of requests per time window"
  type        = string
  default     = "100"
}

variable "rate_limit_window" {
  description = "Rate limit time window in milliseconds"
  type        = string
  default     = "60000"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Application = "Quotes Service"
  }
}
