import { NextResponse } from 'next/server'

const GIPHY_API_KEY = 'Znpzbb8DHDDd0gqyrgepLOnpPUo0bkUB'

export async function GET() {
  try {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=good+vibes+club&limit=50&rating=g`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()

    if (!data.data) return NextResponse.json({ gifs: [] })

    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      title: gif.title || 'GVC GIF',
      url: gif.images?.original?.url || gif.images?.fixed_height?.url || '',
      preview: gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url || '',
    }))

    return NextResponse.json({ gifs })
  } catch (e) {
    return NextResponse.json({ gifs: [] })
  }
}
