export interface GiphyGif {
  id: string
  title: string
  url: string
  preview: string
}

export async function fetchChannelGifs(): Promise<GiphyGif[]> {
  try {
    const res = await fetch('/api/gifs')
    const data = await res.json()
    return data.gifs || []
  } catch {
    return []
  }
}
