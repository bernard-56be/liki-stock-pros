// Test de connexion Supabase direct
const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement à définir manuellement pour le test
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Test de connexion Supabase...');
console.log('URL:', supabaseUrl ? 'Définie' : 'Non définie');
console.log('KEY:', supabaseKey ? 'Définie' : 'Non définie');

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test simple de connexion
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Erreur de connexion:', error);
    } else {
      console.log('Connexion réussie!');
      console.log('Données:', data);
    }
  } catch (err) {
    console.error('Erreur générale:', err);
  }
}

testConnection();
