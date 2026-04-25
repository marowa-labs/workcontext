import OAuth2Strategy from "passport-oauth2";
import { prisma } from "../lib/prisma";
import { SecretsService } from "./secrets-service";

export class OAuthService {
  /**
   * Generate OAuth configuration for a subscription
   */
  async generateOAuthConfig(subscriptionId: string) {
    const subscription = await prisma.institutionalSubscription.findUnique({
      where: { id: subscriptionId },
      select: {
        sso_client_id: true,
        sso_client_secret: true,
        sso_redirect_uri: true,
        sso_authorization_url: true,
        sso_token_url: true,
        domain: true,
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (!subscription.sso_client_id || !subscription.sso_client_secret) {
      throw new Error("OAuth configuration is incomplete");
    }

    // Create OAuth strategy configuration
    const oauthConfig = {
      clientID: subscription.sso_client_id,
      clientSecret: subscription.sso_client_secret,
      callbackURL:
        subscription.sso_redirect_uri ||
        `${await SecretsService.getBaseUrl()}/api/auth/oauth/callback`,
      authorizationURL: subscription.sso_authorization_url || "",
      tokenURL: subscription.sso_token_url || "",
      domain: subscription.domain || "",
    };

    return oauthConfig;
  }

  /**
   * Create OAuth strategy for a subscription
   */
  async createOAuthStrategy(subscriptionId: string) {
    const config = await this.generateOAuthConfig(subscriptionId);

    const oauthStrategy = new OAuth2Strategy(
      {
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackURL,
        authorizationURL: config.authorizationURL,
        tokenURL: config.tokenURL,
      },
      (accessToken: string, refreshToken: string, profile: any, done: any) => {
        // This function is called when OAuth authentication is successful
        return done(null, { accessToken, refreshToken, profile });
      },
    );

    return oauthStrategy;
  }

  /**
   * Validate OAuth tokens
   */
  async validateOAuthTokens(accessToken: string, refreshToken: string) {
    try {
      // First, check if the refresh token exists in our database
      const oauthToken = await prisma.oAuthToken.findUnique({
        where: { refresh_token: refreshToken },
      });

      if (!oauthToken) {
        return {
          valid: false,
          message: "Refresh token not found in database",
        };
      }

      // Check if the access token has expired
      if (oauthToken.expires_at && new Date() > oauthToken.expires_at) {
        return {
          valid: false,
          message: "Access token has expired",
        };
      }

      // Validate access token by making a request to the OAuth provider's userinfo endpoint
      // This is a generic implementation that can work with various OAuth providers

      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Token is valid
        return {
          valid: true,
          message: "OAuth tokens validated successfully",
        };
      } else if (response.status === 401) {
        // Token is invalid or expired
        return {
          valid: false,
          message: "OAuth token is invalid or expired",
        };
      } else {
        // Other error
        const errorText = await response.text();
        throw new Error(
          `Failed to validate OAuth tokens: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error: any) {
      throw new Error(`Failed to validate OAuth tokens: ${error.message}`);
    }
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshOAuthTokens(refreshToken: string) {
    try {
      // Find the OAuth token record to get the associated subscription
      const oauthToken = await prisma.oAuthToken.findUnique({
        where: { refresh_token: refreshToken },
        include: {
          subscription: {
            select: {
              id: true,
              sso_client_id: true,
              sso_client_secret: true,
              sso_token_url: true,
            },
          },
        },
      });

      if (!oauthToken || !oauthToken.subscription) {
        throw new Error(
          "Refresh token not found or associated subscription not found",
        );
      }

      const subscription = oauthToken.subscription;

      if (!subscription.sso_client_id || !subscription.sso_client_secret) {
        throw new Error(
          "OAuth client credentials not configured for this subscription",
        );
      }

      // Use the token URL from the subscription if available, otherwise default to Google's OAuth2 token URL
      const tokenUrl =
        subscription.sso_token_url || "https://oauth2.googleapis.com/token";

      // Make request to token endpoint to refresh tokens
      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", refreshToken);
      params.append("client_id", subscription.sso_client_id);
      params.append("client_secret", subscription.sso_client_secret);

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (response.ok) {
        const data = await response.json();

        // Update the OAuth token record with the new tokens
        const newRefreshToken = data.refresh_token || refreshToken;
        const expiresAt = data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined;

        await prisma.oAuthToken.update({
          where: { refresh_token: refreshToken },
          data: {
            access_token: data.access_token,
            refresh_token: newRefreshToken,
            expires_at: expiresAt,
            token_type: data.token_type,
            scope: data.scope,
            updated_at: new Date(),
          },
        });

        return {
          success: true,
          message: "OAuth tokens refreshed successfully",
          accessToken: data.access_token,
          refreshToken: newRefreshToken,
        };
      } else {
        const errorText = await response.text();
        throw new Error(
          `Failed to refresh OAuth tokens: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error: any) {
      throw new Error(`Failed to refresh OAuth tokens: ${error.message}`);
    }
  }

  /**
   * Store OAuth tokens for a subscription
   */
  async storeOAuthTokens(
    subscriptionId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn?: number,
    tokenType?: string,
    scope?: string,
  ) {
    try {
      // Calculate expiration date
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined;

      // Store the OAuth tokens in the database
      const oauthToken = await prisma.oAuthToken.create({
        data: {
          subscription_id: subscriptionId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          token_type: tokenType,
          scope: scope,
        },
      });

      return {
        success: true,
        message: "OAuth tokens stored successfully",
        oauthTokenId: oauthToken.id,
      };
    } catch (error: any) {
      throw new Error(`Failed to store OAuth tokens: ${error.message}`);
    }
  }
}
