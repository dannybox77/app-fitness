exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const perfil = JSON.parse(event.body || '{}');

    const equipoTexto = (perfil.equipo && perfil.equipo.length) ? perfil.equipo.join(', ') : 'sin equipo (solo peso corporal)';

    const prompt = `Eres un entrenador personal experto. Genera un plan de entrenamiento semanal personalizado para esta persona:

- Edad: ${perfil.edad || 'no especificada'}
- Peso: ${perfil.peso || 'no especificado'} kg
- Altura: ${perfil.altura || 'no especificada'} cm
- Sexo: ${perfil.sexo || 'no especificado'}
- Nivel de actividad: ${perfil.actividad || 'no especificado'}
- Experiencia entrenando: ${perfil.experiencia || 'no especificada'}
- Fuma: ${perfil.fuma || 'no especificado'}
- Consume alcohol: ${perfil.alcohol || 'no especificado'}
- Objetivo principal: ${perfil.objetivo || 'salud general'}
- Días de entrenamiento por semana: ${perfil.diasSemana || 3}
- Dónde entrena: ${perfil.modalidad || 'gimnasio'}
- Equipo disponible en casa: ${equipoTexto}
- Lesiones, condiciones de salud o restricciones físicas: ${perfil.restricciones || 'ninguna'}

Ajusta el plan según todos estos factores:
- Si la experiencia es "principiante", usa ejercicios más simples, menor volumen, y prioriza técnica sobre intensidad. Si es "avanzado", puedes incluir mayor volumen y ejercicios más exigentes.
- Si fuma o consume alcohol con frecuencia, sé más conservador con el volumen de cardio de alta intensidad y progresa gradualmente.
- Respeta estrictamente cualquier lesión o condición de salud indicada — evita ejercicios que la agraven y sugiere alternativas seguras.
- Ajusta el énfasis según el sexo indicado: si es "mujer", dale más volumen (más ejercicios y series) a piernas y glúteos; si es "hombre", dale más volumen a pecho, espalda y brazos; si no se especificó, reparte el volumen de forma equilibrada entre todos los grupos musculares.
- Si "dónde entrena" es "gimnasio", asume acceso a equipo completo de gimnasio (pesas libres, máquinas, barras) en todos los días.
- Si es "casa", usa ÚNICAMENTE el equipo disponible en casa que se listó arriba (si dice "sin equipo", usa solo ejercicios de peso corporal) en todos los días.
- Si es "híbrido", combina días de gimnasio (con equipo completo) y días de casa (usando solo el equipo de casa listado) de forma realista y equilibrada — evita agrupar todos los días de un mismo lugar seguidos uno tras otro. En el "nombre" de cada día, indica claramente si es "(Gimnasio)" o "(Casa)" al final, por ejemplo: "Día 1 — Empuje (Gimnasio)" o "Día 2 — Piernas (Casa)".

Devuelve ÚNICAMENTE un array JSON válido (sin texto antes ni después, sin markdown), con esta forma exacta:
[
  {
    "nombre": "Día 1 — nombre del enfoque de ese día",
    "ejercicios": [
      { "nombre": "nombre del ejercicio", "series": "ej. 4x10", "descanso": "ej. 60 seg" }
    ]
  }
]

El array debe tener exactamente ${perfil.diasSemana || 3} elementos (uno por día). Cada día debe tener entre 4 y 8 ejercicios, apropiados para el objetivo, el sexo, la experiencia, el lugar de entrenamiento, el equipo disponible y las restricciones indicadas. No repitas el mismo grupo muscular en días consecutivos si hay más de 2 días. Responde solo con el JSON.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 3000,
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
