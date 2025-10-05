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

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

