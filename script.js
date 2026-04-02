const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyo1w3GObIhDyYpIoJxvXQxzx6J5iJrDzwW5Oa0dqydu9StClnC3DQwCbYzMAuyLHLI/exec";

async function chamarGoogle(payload) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return await response.json();
}

// Exemplo de uso para listar membros:
// chamarGoogle({ action: 'listMembers', aldeia: 'São Miguel', sociedade: 'Elmo' });
