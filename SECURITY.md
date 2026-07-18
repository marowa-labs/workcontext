# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| main    | ✅ Yes    |

## Reporting a Security Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in this project, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them by:

1. **Email**: Send a detailed report to **[INSERT SECURITY EMAIL]**
2. **Subject Line**: Use `[SECURITY]` prefix in your email subject
3. **Include**: Steps to reproduce, potential impact, and any suggested fixes

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Affected components or files
- Potential impact assessment
- Any suggested remediation (optional)

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Investigation**: We will investigate and provide an initial assessment within 5 business days
- **Fix**: We will work to release a fix as soon as possible depending on severity
- **Disclosure**: We will coordinate public disclosure with you after a fix is available

## Security Best Practices

### For Contributors

1. **Never commit secrets** - API keys, tokens, passwords, or any sensitive credentials should never be committed to the repository
2. **Use environment variables** - All sensitive configuration should be stored in `.env` files (which are gitignored)
3. **Keep dependencies updated** - Regularly update dependencies to patch known vulnerabilities
4. **Follow the principle of least privilege** - Grant minimum necessary permissions
5. **Validate all inputs** - Sanitize and validate all user inputs on both client and server
6. **Use parameterized queries** - Always use parameterized queries to prevent SQL injection

### For Users

1. **Keep your instance updated** - Always run the latest version of the software
2. **Use strong passwords** - Use unique, strong passwords for all accounts
3. **Enable MFA** - Enable multi-factor authentication where available
4. **Protect your `.env` file** - Never share or expose your environment configuration files
5. **Use HTTPS** - Always deploy with HTTPS enabled in production
6. **Regular backups** - Maintain regular backups of your data

## Security Architecture

### Authentication

- Supabase JWT-based authentication
- Multi-factor authentication (Email OTP, SMS OTP, Google OAuth)
- Session management with secure token handling

### Authorization

- Role-based access control (Admin, Editor, Viewer)
- Workspace-level permission isolation
- API endpoint authentication middleware

### Data Protection

- Encrypted API keys at rest (BYOK - Bring Your Own Key)
- HTTPS/TLS for all communications
- Database connection pooling with Prisma ORM
- Input validation and sanitization on all API endpoints

### Infrastructure

- WebSocket connections authenticated via JWT tokens
- CORS configured for allowed origins
- Rate limiting on sensitive endpoints
- Environment-based configuration (no hardcoded secrets)

## Known Security Considerations

- The notification WebSocket server runs on a separate port (8082) which must be accessible
- BYOK encryption keys are stored encrypted in the database
- File uploads should be scanned and validated in production deployments

## Dependencies

We use automated tools to monitor for vulnerable dependencies:

- `npm audit` for Node.js dependencies
- Regular dependency updates via Dependabot or similar tools

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
