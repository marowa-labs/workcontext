import { Request, Response, NextFunction } from "express";

// Validation middleware for SSO configuration
export function validateSSOConfiguration(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { enabled, provider, metadataUrl, entityId, clientId, clientSecret } =
    req.body;

  // If SSO is being enabled, validate required fields
  if (enabled === true) {
    if (!provider) {
      res.status(400).json({
        success: false,
        message: "Provider is required when enabling SSO",
      });
      return;
    }

    if (provider === "saml") {
      // For SAML, either metadata URL or entity ID is required
      if (!metadataUrl && !entityId) {
        res.status(400).json({
          success: false,
          message:
            "Either metadata URL or entity ID is required for SAML provider",
        });
        return;
      }
    } else if (provider === "oauth") {
      // For OAuth, client ID and secret are required
      if (!clientId || !clientSecret) {
        res.status(400).json({
          success: false,
          message: "Client ID and secret are required for OAuth provider",
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid provider. Must be 'saml' or 'oauth'",
      });
      return;
    }
  }

  // Validate URLs if provided
  if (metadataUrl && !isValidUrl(metadataUrl)) {
    res.status(400).json({
      success: false,
      message: "Invalid metadata URL format",
    });
    return;
  }

  next();
}

// Validation middleware for IP restrictions
export function validateIPRestrictions(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { ipRanges } = req.body;

  if (!Array.isArray(ipRanges)) {
    res.status(400).json({
      success: false,
      message: "IP ranges must be an array",
    });
    return;
  }

  if (ipRanges.length === 0) {
    res.status(400).json({
      success: false,
      message: "At least one IP range is required",
    });
    return;
  }

  // Validate each IP range
  for (const ip of ipRanges) {
    if (typeof ip !== "string" || !isValidIPRange(ip)) {
      res.status(400).json({
        success: false,
        message: `Invalid IP range format: ${ip}`,
      });
      return;
    }
  }

  next();
}

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

// Helper function to validate IP ranges (simplified)
function isValidIPRange(ip: string): boolean {
  // This is a simplified validation - in production, you might want more robust validation
  // Supports formats like:
  // - Single IP: 192.168.1.1
  // - CIDR notation: 192.168.1.0/24
  // - IP range: 192.168.1.1-192.168.1.100

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/; // CIDR
  const ipRangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/; // Range
  const singleIpRegex = /^(\d{1,3}\.){3}\d{1,3}$/; // Single IP

  return ipRegex.test(ip) || ipRangeRegex.test(ip) || singleIpRegex.test(ip);
}
