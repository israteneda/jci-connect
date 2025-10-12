type WebhookEvent = 'member.created' | 'member.updated' | 'member.deleted'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
}

export async function triggerN8nWebhook(
  event: WebhookEvent,
  data: any
): Promise<void> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('n8n webhook URL not configured')
    return
  }

  try {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authentication if configured
    const username = import.meta.env.VITE_N8N_WEBHOOK_USERNAME
    const password = import.meta.env.VITE_N8N_WEBHOOK_PASSWORD
    const headerName = import.meta.env.VITE_N8N_WEBHOOK_HEADER_NAME
    const headerValue = import.meta.env.VITE_N8N_WEBHOOK_HEADER_VALUE

    // Option 1: Custom Header Auth (n8n Header Auth)
    if (headerName && headerValue) {
      headers[headerName] = headerValue
    }
    // Option 2: Basic Auth
    else if (username && password) {
      const credentials = "amNpLWNvbm5lY3Q6JWoqVldLJUZzWiRqMSZJU3A="
      headers['Authorization'] = `Basic ${credentials}`
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    console.log(`✅ n8n webhook triggered: ${event}`)
  } catch (error) {
    console.error('❌ n8n webhook error:', error)
    // Don't throw - we don't want to block the user action if webhook fails
  }
}

