// notifications.ts

type NotificationType = 'success' | 'error' | 'info' | undefined;

/**
 * Sets up the notification system
 */
export function setupNotifications(): void {
  const notificationElement = document.getElementById('notification');
  const closeButton = document.getElementById('notification-close');
  
  if (closeButton && notificationElement) {
    closeButton.addEventListener('click', () => {
      notificationElement.classList.remove('show');
    });
  }
}

/**
 * Shows a notification message
 * 
 * @param message - The message to display
 * @param type - The type of notification: 'success', 'error', or 'info'
 */
export function showNotification(message: string, type: NotificationType = undefined): void {
  const notificationElement = document.getElementById('notification');
  const messageElement = document.getElementById('notification-message');
  
  if (notificationElement && messageElement) {
    // Remove all previous type classes
    notificationElement.classList.remove('success', 'error', 'info');
    
    // Add the new type class if provided
    if (type) {
      notificationElement.classList.add(type);
    }
    
    // Set the message and show the notification
    messageElement.textContent = message;
    notificationElement.classList.add('show');
    
    // Auto-hide success and info notifications after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        notificationElement.classList.remove('show');
      }, 5000);
    }
  } else {
    // Fallback to console if notification elements not found
    if (type === 'error') {
      console.error(message);
    } else if (type === 'info') {
      console.info(message);
    } else {
      console.log(message);
    }
  }
}