exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const nutricion = body.nutricion || {};
    const despensa = body.despensa || [];
    const objetivoFitness = body.objetivoFitness || '';

    const despensaTexto = despensa.length
      ? despensa.map(it => `${it.nombre} (${it.cantidad != null ? it.cantidad : '?'} ${it.unidad || ''})`).join(', ')
      : 'despensa vacía';

    const comidasTexto = (nutricion.comidas && nutricion.comidas.length) ? nutricion.comidas.join(', ') : 'no especificadas';

    const prompt = `Eres un nutricionista experto. Sugiere recetas usando principalmente lo que la persona ya tiene en su despensa.

- Objetivo alimenticio: ${nutricion.objetivo || 'no especificado'}
- Objetivo de entrenamiento (para alinear las recetas si aplica): ${objetivoFitness || 'no especificado'}
- Comidas que hace normalmente: ${comidasTexto}
- Restricciones o alergias alimenticias: ${nutricion.restricciones || 'ninguna'}
- Ingredientes en su despensa (con cantidad disponible y unidad): ${despensaTexto}

Genera exactamente 3 recetas que aprovechen al máximo los ingredientes de la despensa, respetando estrictamente las restricciones o alergias indicadas. Es aceptable sugerir 1-2 ingredientes adicionales que la persona probablemente necesite comprar, pero prioriza usar lo que ya tiene. Alinea las recetas con el objetivo alimenticio y, si aplica, con el objetivo de entrenamiento.

Para cada ingrediente que uses de la despensa, indica la cantidad exacta que la receta consume, usando la MISMA unidad que tiene ese ingrediente en la despensa (g, kg, ml, l o unidades), y sin exceder la cantidad disponible. No inventes una unidad distinta a la que ya tiene el ingrediente en la despensa.

Devuelve ÚNICAMENTE un array JSON válido (sin texto antes ni después, sin markdown), con esta forma exacta:
[
  {
    "nombre": "nombre de la receta",
    "tiempo": "ej. 20 min",
    "macros": { "proteina": "ej. 30g", "carbos": "ej. 40g", "grasas": "ej. 12g" },
    "ingredientesUsados": [ { "nombre": "ingrediente de la despensa", "cantidad": 200, "unidad": "g" } ],
    "ingredientesFaltantes": [ { "nombre": "ingrediente que necesita comprar", "cantidad": 1, "unidad": "unidades" } ],
    "pasos": ["paso 1 breve", "paso 2 breve", "paso 3 breve"]
  }
]

Responde solo con el JSON.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error || data }) };
    }

    const texto = (data.content || []).map(b => b.text || '').join('');

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texto })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
