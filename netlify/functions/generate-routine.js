exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const perfil = JSON.parse(event.body || '{}');

    const restricciones = perfil.restricciones || 'ninguna';
    const equipoTexto = (perfil.equipo && perfil.equipo.length) ? perfil.equipo.join(', ') : 'sin equipo especificado';

    const prompt = `Eres un entrenador personal experto. Diseña un plan de entrenamiento semanal a la medida según este perfil:

- Sexo: ${perfil.sexo || 'no especificado'}
- Edad: ${perfil.edad || 'no especificada'}
- Peso: ${perfil.peso || 'no especificado'} kg
- Altura: ${perfil.altura || 'no especificada'} cm
- Nivel de actividad: ${perfil.actividad || 'no especificado'}
- Experiencia entrenando: ${perfil.experiencia || 'no especificada'}
- Objetivo principal: ${perfil.objetivo || 'no especificado'}
- Días de entrenamiento por semana: ${perfil.diasSemana || 3}
- Dónde entrena: ${perfil.modalidad || 'no especificado'}
- Equipo disponible: ${equipoTexto}
- Lesiones, condiciones de salud o restricciones físicas: ${restricciones}

Genera un plan de exactamente ${perfil.diasSemana || 3} días de entrenamiento, cada uno enfocado en un grupo muscular o tipo de entrenamiento distinto y coherente con el objetivo. Respeta estrictamente las restricciones físicas indicadas (evita ejercicios que las agraven). Usa solo ejercicios posibles con el equipo disponible.

Devuelve ÚNICAMENTE un array JSON válido (sin texto antes ni después, sin markdown), con esta forma exacta:
[
  {
    "nombre": "nombre del día, ej. Día 1 - Pecho y tríceps",
    "ejercicios": [
      { "nombre": "nombre del ejercicio", "series": "ej. 4x10", "descanso": "ej. 60 seg" }
    ]
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
