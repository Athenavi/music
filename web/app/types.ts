export interface HomeProps {
  token: string | null;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  handleNextSong: (musicId: string) => void;
  setMusicId: (musicId: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}