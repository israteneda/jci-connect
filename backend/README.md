# JCI Connect Backend API

FastAPI backend service for JCI Connect that handles email and WhatsApp communication using SMTP and Evolution API.

## Features

- Email service with SMTP integration
- WhatsApp service via Evolution API
- Template rendering with Jinja2
- Message logging and tracking
- Configuration management
- Health checks and monitoring

## Quick Start

### Docker (Recommended)

```bash
cd backend
make quick-start
```

This will:
1. Copy `env.example` to `.env`
2. Build the Docker image
3. Start the container

Edit `.env` with your configuration, then run:
```bash
make run
```

### Local Development

```bash
cd backend
pip install -r requirements.txt
cp env.example .env
# Edit .env with your settings
python main.py
```

## Configuration

Required environment variables in `.env`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key

# Note: SMTP and WhatsApp configurations are stored in organization_settings table

# Security
SECRET_KEY=your_secret_key
```

**Important:** Backend only needs the secret key (`sb_secret_...`) for secure database access. The anon key is only needed for frontend applications.

### API Key Security

The backend uses Supabase secret keys for secure database access. Key security best practices:

- **Never expose secret keys** in frontend code, logs, or public repositories
- **Use environment variables** to store secret keys securely
- **Rotate keys regularly** using the Supabase dashboard
- **Use separate keys** for different backend components
- **Monitor key usage** through Supabase logs

For more details, see the [Supabase API Keys documentation](https://supabase.com/docs/guides/api/api-keys).

## API Endpoints

- `POST /api/communication/send-message` - Send message using template
- `POST /api/communication/preview-template` - Preview template with variables
- `POST /api/communication/test-email` - Test SMTP configuration
- `POST /api/communication/test-whatsapp` - Test WhatsApp configuration
- `GET /api/communication/whatsapp/status` - Get WhatsApp instance status
- `GET /api/communication/whatsapp/qr` - Get WhatsApp QR code
- `GET /health` - Health check

## Docker Management

```bash
make help          # Show all commands
make build         # Build image
make run           # Run container
make up            # Start with docker-compose
make down          # Stop services
make logs          # View logs
make shell         # Access container shell
make status        # Show container status
make health        # Check API health
make clean         # Remove containers and images
```

## Project Structure

```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Configuration
│   ├── models/        # Pydantic schemas
│   ├── services/      # Business logic
│   └── utils/         # Utilities
├── main.py           # FastAPI app
├── Dockerfile        # Docker configuration
├── docker-compose.yml # Docker Compose
├── Makefile          # Docker management
└── requirements.txt  # Dependencies
```

## Development

### Adding New Features

1. Create services in `app/services/`
2. Add endpoints in `app/api/`
3. Define schemas in `app/models/schemas.py`
4. Update configuration in `app/core/config.py`

### Testing

```bash
make test           # Run tests in container
make health         # Check API health
```

## Deployment

### Production

```bash
make prod           # Run with multiple workers
```

### Environment Variables

Ensure all required environment variables are set:
- Supabase credentials
- SMTP configuration
- WhatsApp API configuration
- Security keys

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Check username/password
   - Enable app passwords for Gmail
   - Verify SMTP settings

2. **WhatsApp Connection Failed**
   - Verify Evolution API URL
   - Check API key and instance name
   - Ensure instance is connected

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Validate service role key permissions

### Logs

```bash
make logs           # View container logs
make logs-tail      # View last 100 lines
```

## API Documentation

Once running, access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`