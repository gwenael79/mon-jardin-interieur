import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { prenom, nom, email, telephone, password, montant, niveau, label, citation, fleur_image } = await req.json()

    if (!email || !prenom || !nom || !montant || montant < 10) {
      return new Response(JSON.stringify({ error: 'Données manquantes ou invalides.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'https://www.monjardininterieur.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Cercle des Fondateurs — ${label ?? niveau}`,
            description: `Contribution de ${prenom} ${nom} au Cercle des Fondateurs de Mon Jardin Intérieur`,
          },
          unit_amount: Math.round(montant * 100), // centimes
        },
        quantity: 1,
      }],
      metadata: { prenom, nom, email, telephone: telephone ?? '', password: password ?? '', niveau, citation: citation ?? '', fleur_image: fleur_image ?? '', source: 'cercle_fondateurs' },
      success_url: `${appUrl}?cercle=success`,
      cancel_url:  `${appUrl}?cercle=cancel`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[cercle-checkout]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
