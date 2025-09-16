export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface StoryPageData {
  id:string;
  text: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ArtStylePreset {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}
