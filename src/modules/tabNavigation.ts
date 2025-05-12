// tabNavigation.ts
export function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        
        const tabId = tab.getAttribute('data-tab');
        if (tabId) {
          const content = document.getElementById(tabId);
          if (content) {
            content.classList.add('active');
          }
        }
      });
    });
  }