interface WelcomeEmailData {
  email: string
  first_name: string
  last_name: string
  role: string
  member_number?: string
  temp_password?: boolean
  password?: string
  is_update?: boolean
  is_deletion?: boolean
  deleted_user_id?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
    
    // For now, we'll use the test-email endpoint which sends a simple test email
    // TODO: Create proper email templates in the database and use send-message endpoint
    
    if (data.is_deletion) {
      // Send admin notification about user deletion
      await fetch(`${backendUrl}/api/communication/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify('fteneda@jciecuador.com')
      })
      return
    }

    if (data.is_update) {
      // Send update notification to user
      await fetch(`${backendUrl}/api/communication/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.email)
      })
      return
    }

    // Welcome email for new users
    await fetch(`${backendUrl}/api/communication/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data.email)
    })
    
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    // Don't throw error to avoid breaking user creation flow
    // Email sending failure shouldn't prevent user creation
  }
}
